'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, Users, Target, AlertTriangle, FileText, Database, Code, Palette, Download } from 'lucide-react';
import { CodeBlock } from '@/components/ui/code-block';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { PlanningPhase, AnalysisPhase, DesignPhase, QuickStartPhase } from '@/types/project';
import { Skeleton } from '@/components/ui/skeleton';

interface PhaseResultsProps {
  planning: PlanningPhase;
  analysis: AnalysisPhase;
  design: DesignPhase;
  quickStart?: QuickStartPhase | null;
  loadingQuickStart?: boolean;
  onGenerateQuickStart?: (pm: 'npm' | 'yarn' | 'pnpm' | 'bun') => void;
  initialPhase?: 'planning' | 'analysis' | 'design' | 'quickStart';
  onPhaseChange?: (phase: 'planning' | 'analysis' | 'design' | 'quickStart') => void;
}

export default function PhaseResults({ planning, analysis, design, quickStart, loadingQuickStart, onGenerateQuickStart, initialPhase = 'planning', onPhaseChange }: PhaseResultsProps) {
  const [activePhase, setActivePhase] = React.useState<'planning' | 'analysis' | 'design' | 'quickStart'>(initialPhase);
  React.useEffect(() => {
    // Only sync when parent-provided initialPhase actually changes
    if (initialPhase && initialPhase !== activePhase) setActivePhase(initialPhase);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPhase]);
  const [pmChoice, setPmChoice] = React.useState<'npm' | 'yarn' | 'pnpm' | 'bun'>('npm');

  // Unified skeleton for Quick Start generation & regeneration
  const QuickStartSkeleton: React.FC<{ regenerating?: boolean }> = ({ regenerating }) => (
    <div className="space-y-10 animate-in fade-in">
      <div className="flex items-center gap-3">
        <div className="h-3 w-3 rounded-full bg-indigo-500 animate-ping" />
        <p className="text-xs font-medium text-neutral-600 dark:text-neutral-300">
          {regenerating ? 'Regenerating Quick Start (est. 2–5 minutes)...' : 'Generating Quick Start (est. 2–5 minutes)...'}
        </p>
      </div>
      <div className="grid lg:grid-cols-2 gap-10">
        <div className="space-y-8">
          <section className="space-y-3">
            <Skeleton className="h-5 w-64" />
            <Skeleton className="h-28 w-full" />
          </section>
          <section className="space-y-3">
            <Skeleton className="h-5 w-56" />
            <Skeleton className="h-40 w-full" />
          </section>
          <section className="space-y-3">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-32 w-full" />
          </section>
        </div>
        <div className="space-y-8">
          <section className="space-y-3">
            <Skeleton className="h-5 w-72" />
            <div className="space-y-2">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-[92%]" />
              <Skeleton className="h-3 w-[88%]" />
              <Skeleton className="h-3 w-[95%]" />
              <Skeleton className="h-3 w-[70%]" />
            </div>
          </section>
          <section className="space-y-3">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-44" />
          </section>
        </div>
      </div>
      <p className="text-[10px] text-neutral-500 dark:text-neutral-400">This process usually finishes in 2–5 minutes. You can navigate elsewhere meanwhile.</p>
    </div>
  );

  const formatRelative = React.useCallback((iso: string | undefined) => {
    if (!iso) return '—';
    const date = new Date(iso);
    if (isNaN(date.getTime())) return '—';
    const diff = Date.now() - date.getTime();
    const s = Math.floor(diff / 1000);
    if (s < 60) return `${s}s`;
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h`;
    const d = Math.floor(h / 24);
    return `${d}d`;
  }, []);

  const downloadTextFile = (filename: string, content: string) => {
    try {
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
    } catch { /* noop */ }
  };
  // Build a comprehensive one-shot prompt for "vibe coder" style AI tools
  const vibeCoderPrompt = React.useMemo(() => {
    try {
      const lines: string[] = [];
      lines.push(`# Build the Full Application (One-Shot Prompt)`);
      lines.push('You are an elite full-stack engineer + solution architect. Using the structured plan below, generate a production-grade implementation. Focus on clean architecture, type safety, security, DX, and minimum extraneous commentary.');
      lines.push('Output: a cohesive codebase scaffold (folders, representative files, critical implementations) plus any infra/config essentials.');
      lines.push('Avoid: placeholder lorem, trivial boilerplate repetition, invented requirements outside this spec.');
      lines.push('---');
      lines.push(`## Project Overview`);
      lines.push(`Title: ${planning?.scope?.[0] ? planning.scope[0] : ''}`.trim());
      lines.push(`Description: ${planning?.scope?.[1] ? planning.scope[1] : ''}`.trim());
      lines.push('');
      if (planning?.objectives?.length) {
        lines.push('## Objectives');
        planning.objectives.forEach(o => lines.push(`- ${o}`));
        lines.push('');
      }
      if (analysis?.functionalRequirements?.length) {
        lines.push('## Functional Requirements');
        analysis.functionalRequirements.forEach(r => lines.push(`- ${r}`));
        lines.push('');
      }
      if (analysis?.nonFunctionalRequirements?.length) {
        lines.push('## Non-Functional Requirements');
        analysis.nonFunctionalRequirements.forEach(r => lines.push(`- ${r}`));
        lines.push('');
      }
      if (analysis?.userStories?.length) {
        lines.push('## User Stories');
        analysis.userStories.forEach(u => lines.push(`- ${u}`));
        lines.push('');
      }
      if (design?.systemArchitecture?.length) {
        lines.push('## System Architecture');
        design.systemArchitecture.forEach(a => lines.push(`- ${a}`));
        lines.push('');
      }
      if (design?.databaseSchema?.length) {
        lines.push('## Database Schema (Conceptual)');
        design.databaseSchema.forEach(d => lines.push(`- ${d}`));
        lines.push('');
      }
      if (design?.apiEndpoints?.length) {
        lines.push('## API Endpoints (Planned)');
        design.apiEndpoints.forEach(e => lines.push(`- ${e}`));
        lines.push('');
      }
      if (design?.codingStandards?.length) {
        lines.push('## Coding Standards / Conventions');
        design.codingStandards.forEach(c => lines.push(`- ${c}`));
        lines.push('');
      }
      if (quickStart) {
        if (quickStart.installCommands?.length) {
          lines.push('## Install Commands');
          lines.push('```bash');
          quickStart.installCommands.forEach(c => lines.push(c));
          lines.push('```');
          lines.push('');
        }
        if (quickStart.packageScripts && Object.keys(quickStart.packageScripts).length) {
          lines.push('## package.json Scripts');
          lines.push('```json');
          lines.push(JSON.stringify({ scripts: quickStart.packageScripts }, null, 2));
          lines.push('```');
          lines.push('');
        }
        if (quickStart.envExample?.length) {
          lines.push('## .env.example');
          lines.push('```bash');
          quickStart.envExample.forEach(l => lines.push(l));
          lines.push('```');
          lines.push('');
        }
      }
      lines.push('## Delivery Expectations');
      lines.push('- Provide directory tree first, then key file contents.');
      lines.push('- Implement core domain models, API route handlers, and configuration.');
      lines.push('- Include authentication scaffolding if implied by requirements.');
      lines.push('- Add comments only where architectural rationale or non-obvious decisions occur.');
      lines.push('- Ensure environment variable usage matches .env.example exactly.');
      lines.push('- Include minimal tests or examples for critical flows (auth, main business logic).');
      lines.push('- Optimize for readability + extensibility.');
      lines.push('');
      lines.push('Begin now.');
      return lines.join('\n');
    } catch {
      return 'Prompt generation failed.';
    }
  }, [planning, analysis, design, quickStart]);
  const renderListSection = (title: string, items: any, icon: React.ReactNode, color: string) => {
    const safeItems: string[] = Array.isArray(items)
      ? items
      : items == null
        ? []
        : typeof items === 'string'
          ? items.split(/\n+|;+/).map(s => s.trim()).filter(Boolean)
          : Object.values(items).map(v => String(v));
    return (
      <div className="space-y-3">
        <h4 className="font-semibold flex items-center gap-2 text-gray-900 dark:text-neutral-100">
          {icon}
          {title}
        </h4>
        <div className="space-y-2">
          {safeItems.map((item, index) => (
            <div key={index} className="flex items-start gap-2">
              <div className={`w-2 h-2 rounded-full ${color} mt-2 flex-shrink-0`}></div>
              <p className="text-sm text-gray-700 dark:text-neutral-300 leading-relaxed">{item}</p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Specialized renderer for API endpoints with METHOD / path / description parsing
  const renderApiEndpoints = (items: any) => {
    const raw: string[] = Array.isArray(items)
      ? items
      : items == null
        ? []
        : typeof items === 'string'
          ? items.split(/\n+|;+/).map(s => s.trim()).filter(Boolean)
          : Object.values(items).map(v => String(v));

    interface Ep { method?: string; path: string; desc?: string; };
    const methodStyles: Record<string, string> = {
      GET: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      POST: 'bg-blue-100 text-blue-700 border-blue-200',
      PUT: 'bg-amber-100 text-amber-800 border-amber-200',
      PATCH: 'bg-violet-100 text-violet-700 border-violet-200',
      DELETE: 'bg-rose-100 text-rose-700 border-rose-200',
      OPTIONS: 'bg-gray-100 text-gray-700 border-gray-200',
      HEAD: 'bg-gray-100 text-gray-700 border-gray-200'
    };
    const parsed: Ep[] = raw.map(line => {
      const m = line.match(/^([A-Z]+)\s+([^\s]+)(?:\s*[-:–]\s*(.+))?$/);
      if (m && methodStyles[m[1]]) {
        return { method: m[1], path: m[2], desc: m[3] };
      }
      const m2 = line.match(/^([^\s]+)\s*[-:–]\s*(.+)$/);
      if (m2) return { path: m2[1], desc: m2[2] };
      return { path: line };
    });
    return (
      <div className="space-y-3">
        <h4 className="font-semibold flex items-center gap-2 text-gray-900 dark:text-neutral-100">
          <Code className="w-4 h-4" />
          API Endpoints
        </h4>
        <div className="overflow-hidden rounded-lg border">
          <div className="grid grid-cols-12 bg-gray-50 dark:bg-neutral-800/60 border-b px-3 py-2 text-xs font-medium text-gray-600 dark:text-neutral-300">
            <div className="col-span-2">Method</div>
            <div className="col-span-4">Path</div>
            <div className="col-span-6">Description</div>
          </div>
          <ul className="divide-y">
            {parsed.map((ep, i) => (
              <li key={i} className="grid grid-cols-12 px-3 py-2 items-start gap-2 text-xs">
                <div className="col-span-2">
                  {ep.method ? (
                    <span className={`inline-block px-2 py-1 rounded border font-medium tracking-wide ${methodStyles[ep.method]} dark:brightness-90 dark:contrast-125`}>{ep.method}</span>
                  ) : <span className="text-gray-400 dark:text-neutral-500">—</span>}
                </div>
                <div className="col-span-4 font-mono break-all text-blue-700 dark:text-blue-400">{ep.path}</div>
                <div className="col-span-6 text-gray-700 dark:text-neutral-300 leading-snug">{ep.desc || <span className="italic text-gray-400 dark:text-neutral-500">No description</span>}</div>
              </li>
            ))}
            {parsed.length === 0 && (
              <li className="px-3 py-3 text-xs text-gray-500 dark:text-neutral-500 italic">No API endpoints defined.</li>
            )}
          </ul>
        </div>
      </div>
    );
  };

  // Specialized renderer for Database Schema: parse "Entity table: field1, field2 (Type), ..."
  const renderDatabaseSchema = (items: any) => {
    const raw: string[] = Array.isArray(items)
      ? items
      : items == null
        ? []
        : typeof items === 'string'
          ? items.split(/\n+|;+/).map(s => s.trim()).filter(Boolean)
          : Object.values(items).map(v => String(v));

    interface Entity { name: string; fields: { raw: string; name: string; note?: string }[]; original: string; }
    const entities: Entity[] = raw.map(line => {
      // Accept patterns: "Tenants table: id, name..." or "Tenants: id, name..."
      const m = line.match(/^([^:]+?)(?:\s+table)?\s*:\s*(.+)$/i);
      if (!m) return { name: line, fields: [], original: line };
      const name = m[1].trim();
      const fieldsChunk = m[2].trim();
      const fields = fieldsChunk.split(/,\s*/).filter(Boolean).map(f => {
        const fm = f.match(/^([^()]+?)(?:\s*\(([^()]+)\))?$/);
        if (fm) {
          return { raw: f, name: fm[1].trim(), note: fm[2]?.trim() };
        }
        return { raw: f, name: f.trim() };
      });
      return { name, fields, original: line };
    });

    return (
      <div className="space-y-3">
        <h4 className="font-semibold flex items-center gap-2 text-gray-900 dark:text-neutral-100">
          <Database className="w-4 h-4" />
          Database Schema
        </h4>
        <div className="space-y-4">
          {entities.map((e, i) => (
            <div key={i} className="border rounded-lg p-4 bg-white/50 dark:bg-neutral-900/50 hover:shadow-sm transition-shadow border-gray-200 dark:border-neutral-800">
              <div className="flex items-center justify-between mb-2">
                <h5 className="font-medium text-sm text-gray-800 dark:text-neutral-200 flex items-center gap-2">
                  <span className="inline-block px-2 py-0.5 text-[11px] rounded bg-blue-100 text-blue-700 border border-blue-200">TABLE</span>
                  {e.name}
                </h5>
                {e.fields.length > 0 && (
                  <span className="text-[11px] text-gray-500">{e.fields.length} field{e.fields.length === 1 ? '' : 's'}</span>
                )}
              </div>
              {e.fields.length === 0 ? (
                <p className="text-xs italic text-gray-400 dark:text-neutral-500">No fields parsed</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {e.fields.map((f, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded border text-[11px] font-medium bg-gray-50 dark:bg-neutral-800 text-gray-700 dark:text-neutral-300 border-gray-200 dark:border-neutral-700"
                    >
                      <span className="font-mono">{f.name}</span>
                      {f.note && (
                        <span className="text-[10px] px-1 py-0.5 rounded bg-purple-100 text-purple-700 border border-purple-200 dark:bg-purple-900/40 dark:text-purple-300 dark:border-purple-800">{f.note}</span>
                      )}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
          {entities.length === 0 && <p className="text-xs italic text-gray-400 dark:text-neutral-500">No schema defined.</p>}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-neutral-100 mb-2">Waterfall Methodology Results</h2>
        <p className="text-gray-600 dark:text-neutral-400">Comprehensive analysis across all three phases</p>
      </div>

      <Tabs value={activePhase} onValueChange={(v: any) => { setActivePhase(v); onPhaseChange?.(v); }} className="space-y-6">
        <TabsList className="relative grid grid-cols-4 w-full rounded-full p-0.5 bg-neutral-100/70 dark:bg-neutral-900/60 backdrop-blur-xl border border-border/60 overflow-hidden before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_25%_15%,rgba(255,255,255,0.6),transparent_55%)] before:dark:bg-[radial-gradient(circle_at_25%_15%,rgba(255,255,255,0.08),transparent_60%)] before:pointer-events-none">
          <TabsTrigger
            value="planning"
            className="relative w-full rounded-full px-4 sm:px-6 py-2 data-[state=active]:bg-white/80 data-[state=active]:dark:bg-neutral-800/70 data-[state=active]:shadow-sm data-[state=active]:text-neutral-900 dark:data-[state=active]:text-neutral-50 data-[state=inactive]:text-neutral-600 dark:data-[state=inactive]:text-neutral-400 transition-all font-medium text-xs sm:text-sm overflow-hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500/50 gap-2 flex items-center justify-center"
          >
            <span className="relative z-10 inline-flex items-center gap-2"><Clock className="w-4 h-4" /><span className="hidden xs:inline">Planning</span><span className="xs:hidden">Plan</span></span>
            <span className="absolute inset-0 opacity-0 data-[state=active]:opacity-100 bg-[linear-gradient(135deg,var(--tw-gradient-stops))] from-indigo-500/20 via-fuchsia-500/15 to-purple-500/25 dark:from-indigo-400/25 dark:via-fuchsia-400/15 dark:to-purple-400/25 backdrop-blur-sm" />
            <span className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-indigo-500/0 data-[state=active]:ring-indigo-500/30 rounded-full" />
          </TabsTrigger>
          <TabsTrigger
            value="analysis"
            className="relative w-full rounded-full px-4 sm:px-6 py-2 data-[state=active]:bg-white/80 data-[state=active]:dark:bg-neutral-800/70 data-[state=active]:shadow-sm data-[state=active]:text-neutral-900 dark:data-[state=active]:text-neutral-50 data-[state=inactive]:text-neutral-600 dark:data-[state=inactive]:text-neutral-400 transition-all font-medium text-xs sm:text-sm overflow-hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500/50 gap-2 flex items-center justify-center"
          >
            <span className="relative z-10 inline-flex items-center gap-2"><FileText className="w-4 h-4" />Analysis</span>
            <span className="absolute inset-0 opacity-0 data-[state=active]:opacity-100 bg-[linear-gradient(135deg,var(--tw-gradient-stops))] from-indigo-500/20 via-fuchsia-500/15 to-purple-500/25 dark:from-indigo-400/25 dark:via-fuchsia-400/15 dark:to-purple-400/25 backdrop-blur-sm" />
            <span className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-indigo-500/0 data-[state=active]:ring-indigo-500/30 rounded-full" />
          </TabsTrigger>
          <TabsTrigger
            value="design"
            className="relative w-full rounded-full px-4 sm:px-6 py-2 data-[state=active]:bg-white/80 data-[state=active]:dark:bg-neutral-800/70 data-[state=active]:shadow-sm data-[state=active]:text-neutral-900 dark:data-[state=active]:text-neutral-50 data-[state=inactive]:text-neutral-600 dark:data-[state=inactive]:text-neutral-400 transition-all font-medium text-xs sm:text-sm overflow-hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500/50 gap-2 flex items-center justify-center"
          >
            <span className="relative z-10 inline-flex items-center gap-2"><Palette className="w-4 h-4" />Design</span>
            <span className="absolute inset-0 opacity-0 data-[state=active]:opacity-100 bg-[linear-gradient(135deg,var(--tw-gradient-stops))] from-indigo-500/20 via-fuchsia-500/15 to-purple-500/25 dark:from-indigo-400/25 dark:via-fuchsia-400/15 dark:to-purple-400/25 backdrop-blur-sm" />
            <span className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-indigo-500/0 data-[state=active]:ring-indigo-500/30 rounded-full" />
          </TabsTrigger>
          <TabsTrigger
            value="quickStart"
            className="relative w-full rounded-full px-4 sm:px-6 py-2 data-[state=active]:bg-white/80 data-[state=active]:dark:bg-neutral-800/70 data-[state=active]:shadow-sm data-[state=active]:text-neutral-900 dark:data-[state=active]:text-neutral-50 data-[state=inactive]:text-neutral-600 dark:data-[state=inactive]:text-neutral-400 transition-all font-medium text-xs sm:text-sm overflow-hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500/50 gap-2 flex items-center justify-center"
          >
            <span className="relative z-10 inline-flex items-center gap-2"><Code className="w-4 h-4" />Quick Start</span>
            <span className="absolute inset-0 opacity-0 data-[state=active]:opacity-100 bg-[linear-gradient(135deg,var(--tw-gradient-stops))] from-indigo-500/20 via-fuchsia-500/15 to-purple-500/25 dark:from-indigo-400/25 dark:via-fuchsia-400/15 dark:to-purple-400/25 backdrop-blur-sm" />
            <span className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-indigo-500/0 data-[state=active]:ring-indigo-500/30 rounded-full" />
          </TabsTrigger>
        </TabsList>

        <TabsContent value="planning">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-500" />
                  Planning Phase Results
                </CardTitle>
                <CardDescription>
                  Project scope, objectives, and strategic planning
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    {renderListSection(
                      'Project Scope',
                      planning.scope,
                      <Target className="w-4 h-4" />,
                      'bg-blue-500'
                    )}
                    {renderListSection(
                      'Key Objectives',
                      planning.objectives,
                      <Target className="w-4 h-4" />,
                      'bg-green-500'
                    )}
                    {renderListSection(
                      'Stakeholders',
                      planning.stakeholders,
                      <Users className="w-4 h-4" />,
                      'bg-purple-500'
                    )}
                  </div>
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <h4 className="font-semibold flex items-center gap-2 text-gray-900 dark:text-neutral-100">
                        <Clock className="w-4 h-4" />
                        Timeline Estimate
                      </h4>
                      {(() => {
                        if (typeof planning.timeline === 'string') {
                          const rows = planning.timeline.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
                          const parsed = rows.map(line => {
                            const [rawK, rawV] = line.split(':');
                            if (!rawK || !rawV) return null;
                            const k = rawK.trim();
                            const v = rawV.trim();
                            const m = v.match(/(\d+(?:\.\d+)?)\s*(week|weeks|day|days|hour|hours)/i);
                            let weeks = 0;
                            if (m) {
                              const num = parseFloat(m[1]);
                              const unit = m[2].toLowerCase();
                              if (unit.startsWith('week')) weeks = num;
                              else if (unit.startsWith('day')) weeks = num / 5; // assume 5 work days
                              else if (unit.startsWith('hour')) weeks = num / 40; // 40h work week
                            }
                            return { key: k, label: k, raw: v, weeks };
                          }).filter(Boolean) as { key: string; label: string; raw: string; weeks: number }[];
                          const total = parsed.reduce((s, r) => s + r.weeks, 0);
                          if (parsed.length && total > 0) {
                            const colors = ['from-sky-500 to-cyan-400', 'from-emerald-500 to-green-400', 'from-indigo-500 to-violet-500', 'from-amber-500 to-orange-400', 'from-rose-500 to-pink-500', 'from-fuchsia-500 to-purple-500'];
                            return (
                              <TooltipProvider>
                                <div className="space-y-4">
                                  {/* Stacked bar */}
                                  <div className="relative group">
                                    <div className="h-6 w-full rounded-full bg-neutral-200/70 dark:bg-neutral-800 flex overflow-hidden border border-neutral-300/60 dark:border-neutral-700 shadow-inner">
                                      {parsed.map((p, idx) => {
                                        const pct = (p.weeks / total) * 100;
                                        return (
                                          <Tooltip key={p.key}>
                                            <TooltipTrigger asChild>
                                              <div
                                                className={`relative h-full bg-gradient-to-br ${colors[idx % colors.length]} transition-[flex-grow] duration-700 ease-out flex items-center justify-center text-[10px] font-medium text-white/90 hover:text-white`}
                                                style={{ flexGrow: pct, flexBasis: pct + '%' }}
                                              >
                                                {pct > 14 && (
                                                  <span className="px-2 truncate drop-shadow-sm">
                                                    {p.label}
                                                  </span>
                                                )}
                                              </div>
                                            </TooltipTrigger>
                                            <TooltipContent side="top" className="text-xs py-1.5 px-2">
                                              <div className="font-medium text-neutral-900 dark:text-neutral-100">{p.label}</div>
                                              <div className="text-neutral-600 dark:text-neutral-300">{p.raw} · {((p.weeks / total) * 100).toFixed(1)}%</div>
                                            </TooltipContent>
                                          </Tooltip>
                                        );
                                      })}
                                    </div>
                                    <div className="absolute -bottom-5 left-0 w-full flex justify-between text-[10px] text-neutral-500 dark:text-neutral-500 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                      <span>0w</span>
                                      <span>{total.toFixed(1)}w</span>
                                    </div>
                                  </div>
                                  {/* Legend */}
                                  <div className="flex flex-wrap gap-2 text-[11px]">
                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 font-medium text-neutral-700 dark:text-neutral-300">
                                      <Clock className="w-3 h-3" /> Total {total.toFixed(1)}w
                                    </span>
                                    {parsed.map((p, idx) => (
                                      <span key={p.key} className="inline-flex items-center gap-1 px-2 py-1 rounded border bg-neutral-50 dark:bg-neutral-900/50 border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 font-medium">
                                        <span className={`w-2 h-2 rounded-sm bg-gradient-to-br ${colors[idx % colors.length]}`}></span>
                                        {p.label}: {(p.weeks).toFixed(1)}w
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              </TooltipProvider>
                            );
                          }
                        }
                        return (
                          <Badge variant="outline" className="text-sm px-3 py-1 dark:bg-neutral-800/60 dark:border-neutral-700 dark:text-neutral-200">
                            {planning.timeline}
                          </Badge>
                        );
                      })()}
                    </div>
                    {renderListSection(
                      'Required Resources',
                      planning.resources,
                      <Database className="w-4 h-4" />,
                      'bg-orange-500'
                    )}
                    {renderListSection(
                      'Risk Assessment',
                      planning.risks,
                      <AlertTriangle className="w-4 h-4" />,
                      'bg-red-500'
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analysis">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-green-500" />
                  Analysis Phase Results
                </CardTitle>
                <CardDescription>
                  Requirements gathering and system analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    {renderListSection(
                      'Functional Requirements',
                      analysis.functionalRequirements,
                      <Code className="w-4 h-4" />,
                      'bg-blue-500'
                    )}
                    {renderListSection(
                      'User Stories',
                      analysis.userStories,
                      <Users className="w-4 h-4" />,
                      'bg-purple-500'
                    )}
                  </div>
                  <div className="space-y-6">
                    {renderListSection(
                      'Non-Functional Requirements',
                      analysis.nonFunctionalRequirements,
                      <AlertTriangle className="w-4 h-4" />,
                      'bg-orange-500'
                    )}
                    {renderListSection(
                      'System Constraints',
                      analysis.constraints,
                      <Database className="w-4 h-4" />,
                      'bg-red-500'
                    )}
                    {renderListSection(
                      'External Integrations',
                      analysis.integrations,
                      <Target className="w-4 h-4" />,
                      'bg-green-500'
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="design">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="w-5 h-5 text-purple-500" />
                  Design Phase Results
                </CardTitle>
                <CardDescription>
                  System architecture and technical design
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    {renderListSection(
                      'System Architecture',
                      design.systemArchitecture,
                      <Database className="w-4 h-4" />,
                      'bg-blue-500'
                    )}
                    {renderDatabaseSchema(design.databaseSchema)}
                  </div>
                  <div className="space-y-6">
                    {renderListSection(
                      'UI/UX Design',
                      design.uiDesign,
                      <Palette className="w-4 h-4" />,
                      'bg-orange-500'
                    )}
                    {renderListSection(
                      'Coding Standards',
                      design.codingStandards,
                      <Code className="w-4 h-4" />,
                      'bg-red-500'
                    )}
                    {renderApiEndpoints(design.apiEndpoints)}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="quickStart">
          <div className="grid gap-6">
            <Card className="overflow-hidden">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 opacity-80" />
                <CardHeader className="relative z-10 text-white">
                  <CardTitle className="flex items-center gap-2 text-white">
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-white/10 ring-1 ring-white/30 backdrop-blur">
                      <Code className="w-5 h-5" />
                    </span>
                    Quick Start Phase
                    {quickStart && (
                      <Badge variant="secondary" className="bg-white/15 text-white hover:bg-white/25">Generated</Badge>
                    )}
                  </CardTitle>
                  <CardDescription className="text-indigo-100">
                    Installation & environment bootstrap (generated on-demand)
                  </CardDescription>
                </CardHeader>
              </div>
              <CardContent className="pt-6">
                {!quickStart && !loadingQuickStart && (
                  <div className="flex flex-col gap-8">
                    <div className="rounded-xl border border-dashed border-indigo-300/50 dark:border-indigo-500/40 p-6 bg-gradient-to-br from-indigo-50/80 via-white to-white dark:from-indigo-950/30 dark:via-neutral-900 dark:to-neutral-900">
                      <div className="space-y-4">
                        <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
                          Generate a tailored Quick Start including install commands, refined Copilot context, scripts, and an .env example to bootstrap your project in minutes.
                        </p>
                        <div className="flex flex-col gap-3">
                          <span className="text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">Select Package Manager</span>
                          <ToggleGroup type="single" value={pmChoice} onValueChange={v => v && setPmChoice(v as any)} className="flex flex-wrap">
                            {(['npm', 'yarn', 'pnpm', 'bun'] as const).map(pm => (
                              <ToggleGroupItem key={pm} value={pm} aria-label={pm} className="data-[state=on]:bg-indigo-600 data-[state=on]:text-white px-4 py-2 rounded-md text-xs font-semibold">
                                {pm.toUpperCase()}
                              </ToggleGroupItem>
                            ))}
                          </ToggleGroup>
                        </div>
                        <div>
                          <Button onClick={() => onGenerateQuickStart?.(pmChoice)} className="relative inline-flex gap-2">
                            <Code className="w-4 h-4" /> Generate Quick Start
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {loadingQuickStart && !quickStart && (
                  <QuickStartSkeleton />
                )}
                {quickStart && (
                  <div className="space-y-12">
                    {loadingQuickStart ? (
                      <QuickStartSkeleton regenerating />
                    ) : (
                      <>
                        <div className="flex flex-wrap items-center gap-3">
                          <div className="flex items-center gap-3 text-[11px]">
                            <Select value={pmChoice} onValueChange={v => setPmChoice(v as any)}>
                              <SelectTrigger className="w-[120px] h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="npm">npm</SelectItem>
                                <SelectItem value="yarn">yarn</SelectItem>
                                <SelectItem value="pnpm">pnpm</SelectItem>
                                <SelectItem value="bun">bun</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button size="sm" disabled={loadingQuickStart} onClick={() => onGenerateQuickStart?.(pmChoice)} className="h-8 px-3 text-[11px]">
                              Regenerate
                            </Button>
                          </div>
                          <p className="text-[10px] text-neutral-500 dark:text-neutral-400">Full regeneration typically takes 2–5 minutes.</p>
                          <div className="flex flex-wrap gap-2 ml-auto">
                            <Button variant="secondary" size="sm" onClick={() => downloadTextFile(quickStart.copilotInstructions.filename, quickStart.copilotInstructions.content)} className="h-8 gap-1 text-[11px]">
                              <Download className="w-4 h-4" /> {quickStart.copilotInstructions.filename}
                            </Button>
                            <Button variant="secondary" size="sm" onClick={() => downloadTextFile('.env.example', quickStart.envExample.join('\n'))} className="h-8 gap-1 text-[11px]">
                              <Download className="w-4 h-4" /> .env.example
                            </Button>
                          </div>
                        </div>
                        <div className="grid lg:grid-cols-2 gap-10">
                          <div className="space-y-8">
                            <section className="space-y-3">
                              <header className="flex items-center gap-2">
                                <h4 className="font-semibold flex items-center gap-2 text-gray-900 dark:text-neutral-100"><Code className="w-4 h-4" /> Install Packages ({quickStart.packageManager})</h4>
                                <button
                                  onClick={() => navigator.clipboard.writeText(quickStart.installCommands.join('\n'))}
                                  className="text-xs text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 dark:hover:text-indigo-300"
                                >Copy</button>
                              </header>
                              <CodeBlock code={quickStart.installCommands.join('\n')} language="bash" className="bg-neutral-900/90" />
                            </section>
                            <section className="space-y-3">
                              <header className="flex items-center gap-2">
                                <h4 className="font-semibold flex items-center gap-2 text-gray-900 dark:text-neutral-100">package.json Scripts</h4>
                                <button
                                  onClick={() => navigator.clipboard.writeText(JSON.stringify({ scripts: quickStart.packageScripts }, null, 2))}
                                  className="text-xs text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 dark:hover:text-indigo-300"
                                >Copy</button>
                              </header>
                              <CodeBlock code={JSON.stringify({ scripts: quickStart.packageScripts }, null, 2)} language="json" className="bg-neutral-900/90" />
                            </section>
                            <section className="space-y-3">
                              <header className="flex items-center gap-2">
                                <h4 className="font-semibold flex items-center gap-2 text-gray-900 dark:text-neutral-100">.env.example</h4>
                                <button
                                  onClick={() => navigator.clipboard.writeText(quickStart.envExample.join('\n'))}
                                  className="text-xs text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 dark:hover:text-indigo-300"
                                >Copy</button>
                              </header>
                              <CodeBlock code={quickStart.envExample.join('\n')} language="bash" className="bg-neutral-900/90" />
                            </section>
                          </div>
                          <div className="space-y-8">
                            <section className="space-y-3">
                              <header className="flex items-center justify-between gap-2">
                                <h4 className="font-semibold flex items-center gap-2 text-gray-900 dark:text-neutral-100">{quickStart.copilotInstructions.filename}</h4>
                                <button
                                  onClick={() => navigator.clipboard.writeText(quickStart.copilotInstructions.content)}
                                  className="text-xs text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 dark:hover:text-indigo-300"
                                >Copy</button>
                              </header>
                              <div className="border rounded-lg bg-white/80 dark:bg-neutral-900/70 p-4 max-h-[480px] overflow-auto text-[11px] whitespace-pre-wrap font-mono leading-relaxed shadow-inner">
                                {quickStart.copilotInstructions.content}
                              </div>
                            </section>
                            <section className="space-y-2">
                              <h5 className="text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">Generated</h5>
                              <div className="flex flex-wrap items-center gap-3 text-[11px] text-neutral-600 dark:text-neutral-400">
                                <span className="inline-flex items-center gap-1 rounded-full bg-neutral-200 dark:bg-neutral-800 px-2 py-1 font-medium">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                  {formatRelative(quickStart.generatedAt)} ago
                                </span>
                                <time dateTime={quickStart.generatedAt} className="font-mono opacity-80">{quickStart.generatedAt ? new Date(quickStart.generatedAt).toLocaleString() : '—'}</time>
                              </div>
                            </section>
                          </div>
                        </div>
                        {/* Vibe Coder Prompt Section - Improved UI */}
                        <div className="mt-16">
                          <Card className="overflow-hidden border-2 border-fuchsia-500/30 dark:border-fuchsia-700/40 shadow-lg">
                            <div className="relative">
                              <div className="absolute inset-0 h-20 bg-gradient-to-r from-fuchsia-500 via-indigo-500 to-purple-500 opacity-80" />
                              <div className="relative z-10 flex items-center gap-3 px-6 py-5">
                                <span className="inline-flex items-center justify-center h-10 w-10 rounded-lg bg-white/20 ring-2 ring-fuchsia-400/40 backdrop-blur">
                                  <Code className="w-6 h-6 text-white" />
                                </span>
                                <div>
                                  <h3 className="text-xl font-bold text-white tracking-tight">Vibe Coder?</h3>
                                  <p className="text-xs text-fuchsia-100 mt-1">One-shot, high-signal prompt for AI-powered codebase generation</p>
                                </div>
                                <div className="ml-auto flex gap-2">
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button size="sm" variant="secondary" className="h-8 text-[11px] bg-fuchsia-600/80 text-white hover:bg-fuchsia-700/90" onClick={() => navigator.clipboard.writeText(vibeCoderPrompt)}>
                                          <Code className="w-4 h-4 mr-1" /> Copy
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent side="bottom">Copy prompt to clipboard</TooltipContent>
                                    </Tooltip>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button size="sm" className="h-8 text-[11px] bg-indigo-600/80 text-white hover:bg-indigo-700/90" onClick={() => downloadTextFile('vibe-coder-prompt.md', vibeCoderPrompt)}>
                                          <Download className="w-4 h-4 mr-1" /> Download
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent side="bottom">Download prompt as .md file</TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </div>
                              </div>
                            </div>
                            <div className="px-6 pb-6 pt-2">
                              <div className="my-4 border-t border-fuchsia-300/30 dark:border-fuchsia-700/30" />
                              <p className="text-sm text-neutral-700 dark:text-neutral-300 mb-4 max-w-3xl leading-relaxed">
                                Feed this prompt to an autonomous AI coder (Cursor, Windsurf, Claude, etc.) to scaffold a full production-grade application using your complete plan context. <span className="font-semibold text-fuchsia-700 dark:text-fuchsia-400">Review and edit before use for best results.</span>
                              </p>
                              <div className="border rounded-lg bg-gradient-to-br from-white/90 via-fuchsia-50/60 to-indigo-50/80 dark:from-neutral-900/80 dark:via-fuchsia-900/30 dark:to-indigo-900/30 p-4 max-h-[420px] overflow-auto text-[12px] whitespace-pre-wrap font-mono leading-relaxed shadow-inner">
                                {vibeCoderPrompt}
                              </div>
                            </div>
                          </Card>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}