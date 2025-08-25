'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, Users, Target, AlertTriangle, FileText, Database, Code, Palette } from 'lucide-react';
import { PlanningPhase, AnalysisPhase, DesignPhase } from '@/types/project';

interface PhaseResultsProps {
  planning: PlanningPhase;
  analysis: AnalysisPhase;
  design: DesignPhase;
}

export default function PhaseResults({ planning, analysis, design }: PhaseResultsProps) {
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

      <Tabs defaultValue="planning" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="planning" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Planning
          </TabsTrigger>
          <TabsTrigger value="analysis" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Analysis
          </TabsTrigger>
          <TabsTrigger value="design" className="flex items-center gap-2">
            <Palette className="w-4 h-4" />
            Design
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
                      <Badge variant="outline" className="text-sm px-3 py-1 dark:bg-neutral-800/60 dark:border-neutral-700 dark:text-neutral-200">
                        {planning.timeline}
                      </Badge>
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
      </Tabs>
    </div>
  );
}