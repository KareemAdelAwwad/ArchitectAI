import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { MongoPlanRepository } from '@/src/infrastructure/repositories/MongoPlanRepository';
import { ObjectId } from 'mongodb';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const search = req.nextUrl.searchParams;
    const raw = search.get('raw') === '1' || search.get('inline') === '1';
    const format = (search.get('format') || 'pdf').toLowerCase();
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
    }
    const repo = new MongoPlanRepository();
    const stored = await repo.get(session.user.id, params.id);
    if (!stored) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    const { plan } = stored;

    // JSON export pathway (portable plan data)
    if (format === 'json') {
      // Strip any internal fields (currently none besides tasks etc.)
      const jsonBytes = new TextEncoder().encode(JSON.stringify({ plan, exportedAt: new Date().toISOString(), version: 1 }, null, 2));
      return new NextResponse(jsonBytes as any, {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="plan-${params.id}.json"`,
          'Content-Length': String(jsonBytes.byteLength),
          'Cache-Control': 'no-store'
        }
      });
    }
    const pdf = await PDFDocument.create();
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

    // Brand / palette
    const brand = { r: 37 / 255, g: 99 / 255, b: 235 / 255 }; // blue-600
    const brandLight = { r: 219 / 255, g: 234 / 255, b: 254 / 255 }; // light accent
    const grayText = { r: 55 / 255, g: 65 / 255, b: 81 / 255 };
    const subtle = { r: 100 / 255, g: 116 / 255, b: 139 / 255 };

    const pageMargin = 48;
    const baseLine = 16; // increased for better readability
    const contentWidth = (page: any) => page.getSize().width - pageMargin * 2;

    // Utility state
    const sectionPages: { title: string; pageIndex: number }[] = [];

    const addPage = () => pdf.addPage();
    let page = addPage();
    let { width, height } = page.getSize();
    let y = height - pageMargin;

    const ensure = (needed: number) => {
      if (y - needed < pageMargin) {
        page = addPage();
        ; ({ width, height } = page.getSize());
        y = height - pageMargin;
      }
    };

    const drawTextBlock = (text: string, opt: { size?: number; bold?: boolean; color?: { r: number; g: number; b: number }; lineHeight?: number; indent?: number } = {}) => {
      if (!text) return;
      const size = opt.size ?? 10;
      const lh = opt.lineHeight ?? baseLine;
      const usedFont = opt.bold ? bold : font;
      const color = opt.color ? rgb(opt.color.r, opt.color.g, opt.color.b) : rgb(0, 0, 0);
      const maxWidth = contentWidth(page) - (opt.indent ?? 0);
      const words = text.split(/\s+/);
      let line = '';
      const flush = (ln: string) => {
        ensure(lh);
        page.drawText(ln, { x: pageMargin + (opt.indent ?? 0), y, size, font: usedFont, color });
        y -= lh;
      };
      for (const w of words) {
        const test = line ? line + ' ' + w : w;
        const testWidth = usedFont.widthOfTextAtSize(test, size);
        if (testWidth > maxWidth) {
          if (line) flush(line);
          line = w;
        } else line = test;
      }
      if (line) flush(line);
    };

    const sectionHeader = (title: string, subtitle?: string) => {
      // Add extra vertical space BEFORE the heading if not at top of new page
      const pageTopY = page.getSize().height - pageMargin;
      if (y < pageTopY - 8) y -= 32; // wide separation from previous block
      ensure(72);
      const barH = 30;
      const barY = y - barH + 24; // adjust baseline
      page.drawRectangle({ x: pageMargin, y: barY, width: contentWidth(page), height: barH, color: rgb(brand.r, brand.g, brand.b), opacity: 0.08 });
      page.drawRectangle({ x: pageMargin, y: barY, width: 6, height: barH, color: rgb(brand.r, brand.g, brand.b) });
      page.drawText(title.toUpperCase(), { x: pageMargin + 16, y: barY + 12, size: 12, font: bold, color: rgb(brand.r, brand.g, brand.b) });
      if (subtitle) {
        page.drawText(subtitle, { x: pageMargin + 16, y: barY - 2, size: 9, font, color: rgb(subtle.r, subtle.g, subtle.b) });
      }
      y = barY - 36; // increased gap below header before content starts
      sectionPages.push({ title, pageIndex: pdf.getPages().indexOf(page) });
    };

    const toList = (items: any): string[] => {
      if (!items) return [];
      if (Array.isArray(items)) return items.filter(Boolean).map(i => String(i));
      if (typeof items === 'string') return items.split(/\n+|;+/).map(s => s.trim()).filter(Boolean);
      if (typeof items === 'object') return Object.values(items).map(v => (typeof v === 'string' ? v : JSON.stringify(v))).filter(Boolean);
      return [String(items)];
    };

    const bulletList = (items: any) => {
      const lines = toList(items);
      if (lines.length === 0) {
        drawTextBlock('• (none)', { color: grayText, lineHeight: baseLine });
        y -= 8;
        return;
      }
      lines.forEach(l => drawTextBlock('• ' + l, { color: grayText, lineHeight: baseLine }));
      y -= 10; // extra spacing after list block
    };

    // Cover Page
    const cover = page;
    // Decorative band
    cover.drawRectangle({ x: 0, y: height - 140, width, height: 140, color: rgb(brand.r, brand.g, brand.b), opacity: 0.9 });
    cover.drawText('ARCHITECT AI', { x: pageMargin, y: height - 110, size: 16, font: bold, color: rgb(1, 1, 1) });
    cover.drawText(plan.overview.title || 'Project Plan', { x: pageMargin, y: height - 150, size: 28, font: bold, color: rgb(0, 0, 0) });
    const metaYStart = height - 190;
    y = metaYStart;
    drawTextBlock(plan.overview.description || '', { size: 12, color: grayText, lineHeight: 20 });
    y -= 8;
    drawTextBlock(`Type: ${plan.overview.projectType}`, { size: 10, color: subtle });
    drawTextBlock(`Tech Stack: ${plan.overview.techStack.join(', ')}`, { size: 10, color: subtle });
    drawTextBlock(`Timeline: ${plan.overview.timeline}`, { size: 10, color: subtle });
    drawTextBlock(`Exported: ${new Date().toLocaleString()}`, { size: 10, color: subtle });
    y -= 24;
    // Metrics panel (replaces placeholder)
    const tasksAll = plan.tasks || {};
    const metricsTasks = [
      ...((tasksAll.frontend || []).map((t: any) => ({ ...t, category: 'Frontend' }))),
      ...((tasksAll.backend || []).map((t: any) => ({ ...t, category: 'Backend' }))),
      ...((tasksAll.integration || []).map((t: any) => ({ ...t, category: 'Integration' }))),
      ...((tasksAll.deployment || []).map((t: any) => ({ ...t, category: 'Deployment' }))),
    ];
    const totalHours = metricsTasks.reduce((s, t: any) => s + (Number(t.estimatedHours) || 0), 0);
    const byCategory: Record<string, number> = {};
    const byComplexity: Record<string, number> = {};
    metricsTasks.forEach(t => {
      byCategory[t.category] = (byCategory[t.category] || 0) + 1;
      const cx = (t.complexity || 'Unknown').toString();
      byComplexity[cx] = (byComplexity[cx] || 0) + 1;
    });
    // Dynamically size metrics panel to allow more lines (categories + complexities + plan id)
    const linesCat = Object.keys(byCategory).length || 1; // at least 1 placeholder line
    const linesCx = Object.keys(byComplexity).length || 1;
    const extraDetailLines = linesCat + linesCx + 2; // +2 for headers spacing
    // Each detail line roughly 12px, base area for top metrics + padding ~140
    const panelHeight = Math.min(400, Math.max(240, 140 + extraDetailLines * 14));
    const panelY = y - panelHeight;
    cover.drawRectangle({ x: pageMargin, y: panelY, width: contentWidth(cover), height: panelHeight, color: rgb(brand.r, brand.g, brand.b), opacity: 0.05 });
    cover.drawRectangle({ x: pageMargin, y: panelY, width: contentWidth(cover), height: panelHeight, borderWidth: 1, color: rgb(brand.r, brand.g, brand.b), opacity: 0.12 });
    cover.drawText('PROJECT METRICS', { x: pageMargin + 14, y: panelY + panelHeight - 24, size: 9, font: bold, color: rgb(brand.r, brand.g, brand.b) });
    const colWidth = (contentWidth(cover) - 28) / 3;
    const baseX = pageMargin + 14;
    let mY = panelY + panelHeight - 48;
    const topMetric = (x: number, label: string, value: string) => {
      cover.drawText(label.toUpperCase(), { x, y: mY, size: 7, font: bold, color: rgb(subtle.r, subtle.g, subtle.b) });
      cover.drawText(value, { x, y: mY - 16, size: 13, font: bold, color: rgb(grayText.r, grayText.g, grayText.b) });
    };
    topMetric(baseX, 'Total Tasks', String(metricsTasks.length));
    topMetric(baseX + colWidth, 'Est. Hours', totalHours.toFixed(1));
    topMetric(baseX + colWidth * 2, 'Categories', Object.keys(byCategory).length.toString());
    // Divider line
    cover.drawRectangle({ x: pageMargin + 10, y: mY - 28, width: contentWidth(cover) - 20, height: 1, color: rgb(brand.r, brand.g, brand.b), opacity: 0.15 });
    mY -= 42;
    // Vertical stacked details (single column for clarity)
    const kvLines = (obj: Record<string, number>) => Object.entries(obj).map(([k, v]) => `${k}: ${v}`);
    const writeStack = (title: string, lines: string[]) => {
      cover.drawText(title.toUpperCase(), { x: baseX, y: mY, size: 7, font: bold, color: rgb(subtle.r, subtle.g, subtle.b) });
      mY -= 12;
      if (!lines.length) {
        cover.drawText('—', { x: baseX, y: mY, size: 8, font, color: rgb(grayText.r, grayText.g, grayText.b) });
        mY -= 12;
      } else {
        lines.forEach(l => { cover.drawText(l, { x: baseX, y: mY, size: 8, font, color: rgb(grayText.r, grayText.g, grayText.b) }); mY -= 12; });
      }
      mY -= 4;
    };
    writeStack('By Category', kvLines(byCategory));
    writeStack('By Complexity', kvLines(byComplexity));
    cover.drawText('PLAN ID', { x: baseX, y: mY, size: 7, font: bold, color: rgb(subtle.r, subtle.g, subtle.b) });
    cover.drawText(params.id, { x: baseX, y: mY - 12, size: 8, font, color: rgb(grayText.r, grayText.g, grayText.b) });
    y = panelY - 40; // larger gap after panel

    // Table of Contents placeholder page
    const tocPage = addPage();
    let tocY = tocPage.getSize().height - pageMargin;
    tocPage.drawText('TABLE OF CONTENTS', { x: pageMargin, y: tocY, size: 14, font: bold, color: rgb(brand.r, brand.g, brand.b) });
    tocY -= 28;

    // Reset for content pages
    page = addPage();
    ; ({ width, height } = page.getSize());
    y = height - pageMargin;

    // Sections
    const wp = plan.waterfallPhases || {};
    const planning = wp.planning || {};
    const analysis = wp.analysis || {};
    const design = wp.design || {};

    sectionHeader('Overview', 'High-level snapshot');
    drawTextBlock(plan.overview.description || '', { size: 11, color: grayText, lineHeight: 20 });
    y -= 4;
    drawTextBlock('Tech Stack: ' + plan.overview.techStack.join(', '), { size: 10, color: subtle });
    drawTextBlock('Timeline: ' + plan.overview.timeline, { size: 10, color: subtle });
    y -= 8;

    sectionHeader('Planning Phase');
    bulletList(planning.scope);
    bulletList(planning.objectives);
    bulletList(planning.stakeholders);
    if (planning.timeline) drawTextBlock('Timeline: ' + planning.timeline, { color: grayText });
    bulletList(planning.resources);
    bulletList(planning.risks);

    sectionHeader('Analysis Phase');
    bulletList(analysis.functionalRequirements);
    bulletList(analysis.userStories);
    bulletList(analysis.nonFunctionalRequirements);
    bulletList(analysis.constraints);
    bulletList(analysis.integrations);

    sectionHeader('Design Phase');
    bulletList(design.systemArchitecture);
    bulletList(design.databaseSchema);
    bulletList(design.apiEndpoints);
    bulletList(design.uiDesign);
    bulletList(design.codingStandards);

    // Tasks
    sectionHeader('Tasks', 'Work packages summary');
    const tasks = plan.tasks || {};
    const allTasks = [
      ...((tasks.frontend || []).map((t: any) => ({ ...t, category: 'Frontend' }))),
      ...((tasks.backend || []).map((t: any) => ({ ...t, category: 'Backend' }))),
      ...((tasks.integration || []).map((t: any) => ({ ...t, category: 'Integration' }))),
      ...((tasks.deployment || []).map((t: any) => ({ ...t, category: 'Deployment' }))),
    ];
    drawTextBlock(`Total Tasks: ${allTasks.length}`, { size: 10, bold: true, color: grayText });

    // Table headers
    const col = [0, 90, 340, 420, 470]; // relative positions from margin
    const headerY = () => { ensure(baseLine); return y; };
    const drawRow = (cells: string[], styles?: { bold?: boolean }) => {
      const rowSize = 9;
      const rowHeight = 12;
      ensure(rowHeight);
      const rowY = y;
      const usedFont = styles?.bold ? bold : font;
      cells.forEach((c, i) => {
        const maxW = (col[i + 1] ? col[i + 1] - col[i] - 6 : contentWidth(page) - col[i]) - 4;
        let text = c || '';
        if (usedFont.widthOfTextAtSize(text, rowSize) > maxW) {
          while (text.length && usedFont.widthOfTextAtSize(text + '…', rowSize) > maxW) text = text.slice(0, -1);
          text += '…';
        }
        page.drawText(text, { x: pageMargin + col[i] + 2, y: rowY, size: rowSize, font: usedFont, color: rgb(grayText.r, grayText.g, grayText.b) });
      });
      y -= rowHeight;
    };
    // Header background
    const hy = headerY();
    page.drawRectangle({ x: pageMargin, y: hy - 2, width: contentWidth(page), height: 14, color: rgb(brand.r, brand.g, brand.b), opacity: 0.1 });
    drawRow(['Category', 'Title', 'Complexity', 'Est.H'], { bold: true });
    allTasks.forEach(t => drawRow([t.category, t.title, t.complexity, String(t.estimatedHours || '')]));
    if (allTasks.length === 0) drawTextBlock('(No tasks)', { color: grayText });

    // Populate TOC now that sections known
    const totalPages = pdf.getPageCount();
    const padDots = (label: string, target: number) => {
      const dots = '.'.repeat(Math.max(2, target - label.length));
      return label + ' ' + dots;
    };
    sectionPages.forEach(sp => {
      if (tocY < pageMargin + 20) {
        // add overflow TOC page
        const extra = pdf.addPage();
        tocY = extra.getSize().height - pageMargin;
        extra.drawText('TABLE OF CONTENTS (cont.)', { x: pageMargin, y: tocY, size: 12, font: bold, color: rgb(brand.r, brand.g, brand.b) });
        tocY -= 24;
        // reuse extra as tocPage variable? not required further
      }
      const label = sp.title;
      const pageNum = sp.pageIndex + 1; // 1-based
      const entry = padDots(label, 60 - String(pageNum).length);
      tocPage.drawText(entry + pageNum, { x: pageMargin, y: tocY, size: 9, font, color: rgb(grayText.r, grayText.g, grayText.b) });
      tocY -= 12;
    });

    // Footer page numbers
    pdf.getPages().forEach((p, i) => {
      p.drawText(`Page ${i + 1} / ${totalPages}`, { x: p.getSize().width - pageMargin - 80, y: 20, size: 8, font, color: rgb(subtle.r, subtle.g, subtle.b) });
      p.drawText('Architect AI', { x: pageMargin, y: 20, size: 8, font: bold, color: rgb(subtle.r, subtle.g, subtle.b) });
    });

    const pdfBytes = await pdf.save();
    const bytes = pdfBytes instanceof Uint8Array ? pdfBytes : new Uint8Array(pdfBytes);
    return new NextResponse(bytes as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        ...(raw ? {} : { 'Content-Disposition': `attachment; filename="plan-${params.id}.pdf"` }),
        'Content-Length': String(bytes.byteLength),
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
        'X-Debug-Pdf': '1'
      }
    });
  } catch (e) {
    console.error('Export error', e);
    return NextResponse.json({ error: 'Failed to export PDF' }, { status: 500 });
  }
}

