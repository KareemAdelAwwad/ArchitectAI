"use client";

import React, { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Calendar, Database, Layers3, Clock, Users } from 'lucide-react';
import { ProjectPlan } from '@/types/project';

interface PlanOverviewHeroProps {
  plan: ProjectPlan;
  isOwner?: boolean;
  collaboratorRole?: 'viewer' | 'editor' | null;
  collaborators?: Array<{ userId: string; role: 'viewer' | 'editor'; name?: string | null; image?: string | null }>;
}

export const PlanOverviewHero: React.FC<PlanOverviewHeroProps> = ({ plan, isOwner, collaboratorRole, collaborators }) => {
  const stats = useMemo(() => {
    const allTasks = [
      ...plan.tasks.frontend,
      ...plan.tasks.backend,
      ...plan.tasks.integration,
      ...plan.tasks.deployment
    ];
    const completed = allTasks.filter(t => t.completed).length;
    const hours = allTasks.reduce((a, t) => a + t.estimatedHours, 0);
    const complexityCounts = allTasks.reduce<Record<string, number>>((acc, t) => { acc[t.complexity] = (acc[t.complexity] || 0) + 1; return acc; }, {});
    return { allTasks, completed, hours, complexityCounts };
  }, [plan]);

  return (
    <div className="relative rounded-3xl overflow-hidden border border-border/60 bg-gradient-to-br from-indigo-600/20 via-fuchsia-600/10 to-transparent dark:from-indigo-500/15 dark:via-fuchsia-500/10 dark:to-transparent p-[1px] shadow-xl">
      <div className="relative rounded-[calc(1.5rem-1px)] h-full w-full bg-white/70 dark:bg-neutral-900/60 backdrop-blur-xl supports-[backdrop-filter]:bg-white/50 dark:supports-[backdrop-filter]:bg-neutral-900/40 p-8">
        <div className="absolute inset-0 pointer-events-none select-none opacity-40 mix-blend-overlay bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.6),transparent_60%),radial-gradient(circle_at_80%_30%,rgba(147,51,234,0.25),transparent_60%),radial-gradient(circle_at_50%_80%,rgba(79,70,229,0.3),transparent_65%)]" />
        <div className="relative flex flex-col gap-8">
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="outline" className="bg-white/60 dark:bg-neutral-800/40 backdrop-blur-sm">{plan.overview.projectType}</Badge>
              {isOwner && <Badge variant="secondary" className="bg-emerald-500/80 text-white shadow">Owner</Badge>}
              {!isOwner && collaboratorRole && <Badge variant="secondary" className="capitalize bg-sky-500/80 text-white shadow">{collaboratorRole}</Badge>}
              <Badge variant="outline" className="bg-white/60 dark:bg-neutral-800/40 backdrop-blur-sm">{plan.overview.timeline}</Badge>
            </div>
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight leading-tight bg-gradient-to-r from-indigo-700 via-fuchsia-700 to-purple-600 dark:from-indigo-300 dark:via-fuchsia-300 dark:to-purple-200 bg-clip-text text-transparent">
              {plan.overview.title}
            </h1>
            <p className="max-w-3xl text-sm md:text-base leading-relaxed text-neutral-700 dark:text-neutral-300">
              {plan.overview.description}
            </p>
            <div className="flex flex-wrap gap-2 pt-1 max-h-44 overflow-auto pr-1">
              {plan.overview.techStack.map(t => (
                <span key={t} className="text-[11px] px-2 py-1 rounded-md border border-border/60 bg-white/50 dark:bg-neutral-800/60 dark:border-neutral-700 tracking-tight font-medium text-neutral-700 dark:text-neutral-200">
                  {t}
                </span>
              ))}
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-4">
            <MetricCard label="Tasks" icon={<Layers3 className="w-4 h-4" />} value={stats.allTasks.length} accent="from-indigo-500 to-indigo-600" />
            <MetricCard label="Completed" icon={<Calendar className="w-4 h-4" />} value={`${stats.completed}/${stats.allTasks.length}`} accent="from-emerald-500 to-emerald-600" />
            <MetricCard label="Est. Hours" icon={<Clock className="w-4 h-4" />} value={stats.hours} accent="from-fuchsia-500 to-fuchsia-600" />
            <MetricCard label="Team" icon={<Users className="w-4 h-4" />} value={collaborators?.length || 1} accent="from-cyan-500 to-cyan-600" />
          </div>
          <div className="flex flex-wrap gap-2 text-[10px] text-neutral-500 dark:text-neutral-400">
            {Object.entries(stats.complexityCounts).map(([k, v]) => (
              <span key={k} className="px-2 py-[3px] rounded-full bg-neutral-900/5 dark:bg-white/5 border border-border/50 flex items-center gap-1">
                <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: k === 'Simple' ? '#10b981' : k === 'Medium' ? '#f59e0b' : '#ef4444' }} />
                {k}: {v}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

interface MetricCardProps { label: string; value: React.ReactNode; icon: React.ReactNode; accent: string; }
const MetricCard: React.FC<MetricCardProps> = ({ label, value, icon, accent }) => (
  <div className="relative group rounded-xl border border-border/60 bg-white/60 dark:bg-neutral-800/40 backdrop-blur-md p-4 overflow-hidden">
    <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-br ${accent} mix-blend-overlay`} />
    <div className="relative flex items-center gap-3">
      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-neutral-900/5 to-neutral-900/10 dark:from-white/5 dark:to-white/10 flex items-center justify-center border border-border/60">
        {icon}
      </div>
      <div className="flex flex-col">
        <span className="text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400 font-medium">{label}</span>
        <span className="text-lg font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">{value}</span>
      </div>
    </div>
  </div>
);

export default PlanOverviewHero;
