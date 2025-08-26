"use client";
import Image from 'next/image';
import { useTheme } from 'next-themes';
import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';

// Lightweight horizontal showcase using scroll-snap (no heavy carousel JS)
export function ScreenshotsShowcase() {
  const { theme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const effective = (theme === 'system' ? systemTheme : theme) || 'light';
  const mode = effective === 'dark' ? 'dark' : 'light';
  const shots: Array<{ key: string; title: string; caption: string; file: string }> = [
    { key: 'tasks', title: 'Tasks Breakdown', caption: 'Auto-generated, categorized engineering tasks with estimates.', file: 'tasks.png' },
    { key: 'planning', title: 'Planning Scope', caption: 'Clear scope, objectives, stakeholders & risks.', file: 'planning.png' },
    { key: 'analysis', title: 'Analysis & Requirements', caption: 'Functional / non-functional requirements & user stories.', file: 'analysis.png' },
  ];
  const [active, setActive] = useState<null | typeof shots[number]>(null);
  const close = useCallback(() => setActive(null), []);
  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [active, close]);

  return (
    <section className="py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4">
        <div className="relative rounded-3xl border border-white/60 dark:border-white/10 bg-white/65 dark:bg-neutral-900/40 backdrop-blur-md shadow-[0_4px_30px_-8px_rgba(0,0,0,0.2)] overflow-hidden">
          <div className="pointer-events-none absolute inset-0 opacity-60 mix-blend-overlay bg-[radial-gradient(circle_at_60%_30%,rgba(255,255,255,0.75),transparent_60%),radial-gradient(circle_at_20%_80%,rgba(99,102,241,0.25),transparent_65%)] dark:bg-[radial-gradient(circle_at_60%_30%,rgba(255,255,255,0.08),transparent_60%),radial-gradient(circle_at_20%_80%,rgba(99,102,241,0.25),transparent_65%)]" />
          <div className="relative p-8 md:p-12">
            <div className="flex items-end justify-between mb-10 gap-4 flex-wrap">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight">See the real output</h2>
                <p className="mt-2 text-sm md:text-base text-neutral-600 dark:text-neutral-400 max-w-xl">Actual screenshots from a generated plan (click any to view full size).</p>
              </div>
              <div className="text-xs text-neutral-500 dark:text-neutral-500">Theme: {mounted ? mode : '…'}</div>
            </div>
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.6 }}
              className="grid gap-8 md:grid-cols-3"
            >
              {shots.map((s, i) => (
                <motion.figure
                  key={s.key}
                  className="group relative cursor-pointer"
                  initial={{ opacity: 0, scale: 0.96 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08, duration: 0.4 }}
                >
                  <button
                    type="button"
                    onClick={() => setActive(s)}
                    className="relative w-full text-left rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 border border-neutral-200/70 dark:border-neutral-800/80 bg-neutral-50/60 dark:bg-neutral-900/40 backdrop-blur overflow-hidden shadow-sm ring-1 ring-black/5"
                    aria-label={`Open full size: ${s.title}`}
                  >
                    <div className="flex items-center gap-1 h-7 px-3 text-[10px] tracking-wide uppercase font-medium bg-gradient-to-r from-neutral-100/70 to-neutral-50/40 dark:from-neutral-800/60 dark:to-neutral-800/20 border-b border-neutral-200/70 dark:border-neutral-800/70">
                      <span className="w-2 h-2 rounded-full bg-red-400" />
                      <span className="w-2 h-2 rounded-full bg-yellow-400" />
                      <span className="w-2 h-2 rounded-full bg-green-400" />
                      <span className="ml-2 text-neutral-500 dark:text-neutral-400 normal-case truncate">{s.title}</span>
                    </div>
                    <Image
                      src={`/screenshots/${mode}/${s.file}`}
                      alt={`${s.title} screenshot`}
                      width={900}
                      height={620}
                      sizes="(max-width:768px) 100vw, (max-width:1200px) 33vw, 400px"
                      className="w-full h-auto select-none transition-transform duration-300 group-hover:scale-[1.02]"
                      priority={i === 0}
                      loading={i === 0 ? 'eager' : 'lazy'}
                    />
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-br from-blue-500/0 via-purple-500/0 to-pink-500/0 group-hover:via-purple-500/10" />
                  </button>
                  <figcaption className="mt-3 text-xs text-neutral-600 dark:text-neutral-400 leading-snug max-w-sm">{s.caption}</figcaption>
                </motion.figure>
              ))}
            </motion.div>
          </div>
        </div>
      </div>
      {active && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-10 bg-black/80 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={active.title}>
          <button
            onClick={close}
            className="absolute top-4 right-4 text-neutral-300 hover:text-white text-sm font-medium bg-neutral-800/60 hover:bg-neutral-700/60 px-3 py-1.5 rounded-md border border-neutral-700/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50"
          >Close ✕</button>
          <div className="max-w-6xl w-full mx-auto">
            <div className="mb-4 flex flex-col sm:flex-row sm:items-center gap-2 justify-between">
              <h3 className="text-base font-semibold text-white tracking-tight">{active.title}</h3>
              <p className="text-xs text-neutral-300 max-w-xl leading-relaxed">{active.caption}</p>
            </div>
            <div className="relative rounded-xl overflow-hidden border border-neutral-700/70 bg-neutral-900 shadow-lg">
              <Image
                src={`/screenshots/${mode}/${active.file}`}
                alt={`${active.title} full size screenshot`}
                width={1600}
                height={1100}
                className="w-full h-auto"
                sizes="100vw"
                priority
              />
            </div>
          </div>
          <div className="absolute inset-0" onClick={close} aria-hidden="true" />
        </div>
      )}
    </section>
  );
}

export default ScreenshotsShowcase;