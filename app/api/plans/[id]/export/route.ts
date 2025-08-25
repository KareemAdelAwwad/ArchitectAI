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
    const pdf = await PDFDocument.create();
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

    const pageMargin = 50;
    const lineHeight = 14;
    let page = pdf.addPage();
    const { width, height } = page.getSize();
    let y = height - pageMargin;

    const addText = (text: string, options: { size?: number; bold?: boolean; color?: { r: number; g: number; b: number } } = {}) => {
      const size = options.size ?? 10;
      const usedFont = options.bold ? bold : font;
      const color = options.color ? rgb(options.color.r, options.color.g, options.color.b) : rgb(0, 0, 0);
      const maxWidth = width - pageMargin * 2;
      const words = text.split(/\s+/);
      let line = '';
      const pushLine = (ln: string) => {
        if (y < pageMargin + lineHeight) {
          page = pdf.addPage();
          y = page.getSize().height - pageMargin;
        }
        page.drawText(ln, { x: pageMargin, y, size, font: usedFont, color });
        y -= lineHeight + (size > 12 ? 2 : 0);
      };
      for (const w of words) {
        const test = line ? line + ' ' + w : w;
        const testWidth = usedFont.widthOfTextAtSize(test, size);
        if (testWidth > maxWidth) {
          if (line) pushLine(line);
          line = w;
        } else {
          line = test;
        }
      }
      if (line) pushLine(line);
    };

    const sectionHeader = (title: string) => {
      addText(title, { size: 14, bold: true, color: { r: 0.1, g: 0.3, b: 0.6 } });
      y -= 4;
    };

    const toList = (items: any): string[] => {
      if (!items) return [];
      if (Array.isArray(items)) return items.filter(Boolean).map(i => String(i));
      if (typeof items === 'string') {
        return items
          .split(/\n+|;+/)
          .map(s => s.trim())
          .filter(Boolean);
      }
      if (typeof items === 'object') {
        return Object.values(items)
          .map(v => (typeof v === 'string' ? v : JSON.stringify(v)))
          .filter(Boolean);
      }
      return [String(items)];
    };
    const bulletList = (items: any) => {
      const list = toList(items);
      list.forEach(i => addText('• ' + i));
      if (list.length === 0) addText('• (none)');
      y -= 4;
    };

    // Cover / Overview
    sectionHeader('Project Plan');
    addText(plan.overview.title, { size: 18, bold: true, color: { r: 0, g: 0, b: 0 } });
    y -= 6;
    addText(plan.overview.description, { size: 11 });
    y -= 6;
    addText(`Type: ${plan.overview.projectType}`);
    addText(`Tech Stack: ${plan.overview.techStack.join(', ')}`);
    addText(`Timeline: ${plan.overview.timeline}`);
    y -= 10;

    // Waterfall Phases (defensive)
    const wp = plan.waterfallPhases || {};
    const planning = wp.planning || {};
    const analysis = wp.analysis || {};
    const design = wp.design || {};

    sectionHeader('Planning Phase');
    bulletList(planning.scope);
    bulletList(planning.objectives);
    bulletList(planning.stakeholders);
    if (planning.timeline) addText('Timeline: ' + planning.timeline);
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

    // Tasks summary
    sectionHeader('Tasks');
    const tasks = plan.tasks || {};
    const allTasks = [
      ...((tasks.frontend || []).map((t: any) => ({ ...t, category: 'Frontend' }))),
      ...((tasks.backend || []).map((t: any) => ({ ...t, category: 'Backend' }))),
      ...((tasks.integration || []).map((t: any) => ({ ...t, category: 'Integration' }))),
      ...((tasks.deployment || []).map((t: any) => ({ ...t, category: 'Deployment' }))),
    ];
    addText(`Total Tasks: ${allTasks.length}`);
    allTasks.forEach(t => {
      addText(`${t.category}: ${t.title} [${t.complexity}, ${t.estimatedHours}h]`);
      if (t.description) addText('   ' + t.description);
    });
    if (allTasks.length === 0) addText('(No tasks)');

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

