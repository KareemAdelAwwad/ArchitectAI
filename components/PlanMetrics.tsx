"use client";

import React, { useMemo } from 'react';
import { Progress } from '@/components/ui/progress';
import { ProjectPlan } from '@/types/project';

interface PlanMetricsProps {
  plan: ProjectPlan;
}

export const PlanMetrics: React.FC<PlanMetricsProps> = ({ plan }) => {
  const { completionRate, byCategory, totalTasks } = useMemo(() => {
    const cat: Record<string, { total: number; completed: number; hours: number; }> = {
      frontend: { total: 0, completed: 0, hours: 0 },
      backend: { total: 0, completed: 0, hours: 0 },
      integration: { total: 0, completed: 0, hours: 0 },
      deployment: { total: 0, completed: 0, hours: 0 }
    };
    (Object.keys(cat) as Array<keyof typeof cat>).forEach(k => {
      const list = (plan.tasks as any)[k] as any[];
      cat[k].total = list.length;
      cat[k].completed = list.filter(t => t.completed).length;
      cat[k].hours = list.reduce((a, t) => a + t.estimatedHours, 0);
    });
    const totalTasks = Object.values(cat).reduce((a, c) => a + c.total, 0);
    const completionRate = totalTasks ? (Object.values(cat).reduce((a, c) => a + c.completed, 0) / totalTasks) * 100 : 0;
    return { byCategory: cat, completionRate, totalTasks };
  }, [plan]);

  return (
    <div className="rounded-2xl border border-border/60 p-6 bg-white/70 dark:bg-neutral-900/50 backdrop-blur supports-[backdrop-filter]:bg-white/50 dark:supports-[backdrop-filter]:bg-neutral-900/40">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
        <h3 className="text-sm font-semibold tracking-tight">Progress Overview</h3>
        <div className="text-[11px] text-neutral-500 dark:text-neutral-400">{Math.round(completionRate)}% complete • {totalTasks} tasks</div>
      </div>
      <Progress value={completionRate} className="h-2 mb-6" />
      <div className="grid md:grid-cols-4 gap-4 text-[11px]">
        {Object.entries(byCategory).map(([cat, v]) => (
          <div key={cat} className="space-y-1">
            <div className="flex items-center justify-between font-medium capitalize">
              <span>{cat}</span>
              <span className="text-neutral-500 dark:text-neutral-400">{v.completed}/{v.total}</span>
            </div>
            <div className="h-1.5 rounded-full bg-neutral-200/70 dark:bg-neutral-800/80 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-purple-500" style={{ width: `${v.total ? (v.completed / v.total) * 100 : 0}%` }} />
            </div>
            <div className="text-[10px] text-neutral-500 dark:text-neutral-500">{v.hours}h est.</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PlanMetrics;
