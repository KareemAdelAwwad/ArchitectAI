"use client";
import { motion, useScroll, useTransform } from 'framer-motion';
import { Sparkles, Workflow, Users, Brain, ListChecks, Layers3, Target } from 'lucide-react';
import AuthButton from '@/components/AuthButton';
import { ShinyButton } from '@/components/ui/shiny-button';
import { useRef } from 'react';

// Magnetic button wrapper
function Magnetic({ children, strength = 25 }: { children: React.ReactNode; strength?: number }) {
  const ref = useRef<HTMLDivElement | null>(null);
  return (
    <div
      ref={ref}
      onMouseMove={(e) => {
        const el = ref.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        el.style.setProperty('--mag-x', (x / strength).toString());
        el.style.setProperty('--mag-y', (y / strength).toString());
      }}
      onMouseLeave={() => {
        const el = ref.current; if (el) { el.style.setProperty('--mag-x', '0'); el.style.setProperty('--mag-y', '0'); }
      }}
      className="[transform:translate3d(var(--mag-x,0)_px,var(--mag-y,0)_px,0)] transition-transform duration-200 will-change-transform"
    >
      {children}
    </div>
  );
}

// Floating animated panels replacing code preview
const floatingPanels = [
  { icon: <ListChecks className="w-4 h-4" />, title: 'Structured Tasks', blurb: 'Auto-categorized with estimates.' },
  { icon: <Layers3 className="w-4 h-4" />, title: 'Waterfall Phases', blurb: 'Planning, analysis, design.' },
  { icon: <Target className="w-4 h-4" />, title: 'Refine with AI', blurb: 'Iterate any section instantly.' }
];

function FloatingPanels() {
  return (
    <div className="relative grid gap-5">
      <div className="absolute" />
      {floatingPanels.map((p, i) => (
        <motion.div
          key={p.title}
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.2 + i * 0.15, type: 'spring', stiffness: 120, damping: 18 }}
          className="relative rounded-xl border border-neutral-200/70 dark:border-neutral-800/70 bg-white/70 dark:bg-neutral-900/60 backdrop-blur-xl p-5 shadow-sm overflow-hidden group"
        >
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5" />
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-md bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center text-white shadow">{p.icon}</div>
            <h4 className="font-semibold text-sm tracking-tight">{p.title}</h4>
          </div>
          <p className="text-[13px] leading-relaxed text-neutral-600 dark:text-neutral-400">{p.blurb}</p>
        </motion.div>
      ))}
      {/* <motion.div
        aria-hidden
        className="absolute -bottom-10 -right-10 w-52 h-52 rounded-full bg-gradient-to-tr from-blue-500/30 via-purple-500/30 to-pink-500/30 blur-2xl opacity-40 animate-pulse"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 0.4 }}
        transition={{ duration: 1.2, ease: 'easeOut' }}
      /> */}
    </div>
  );
}

// Simple hero section with subtle animations
export function Hero() {
  const ref = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const yBg = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const yCode = useTransform(scrollYProgress, [0, 1], ["0%", "-20%"]);
  return (
    <div ref={ref} className="relative py-24 sm:py-32 overflow-hidden">
      <motion.div style={{ y: yBg }} className="absolute inset-0 -z-10 pointer-events-none">
        <div className="absolute inset-0 " />
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[520px] w-[1100px] rounded-full opacity-60" />
      </motion.div>
      <div className="mx-auto max-w-7xl px-4 relative">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="grid lg:grid-cols-2 gap-12 items-center"
        >
          <div className="text-center lg:text-left max-w-xl mx-auto">
            <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium mb-6 bg-background/70 backdrop-blur">
              <Sparkles className="w-3.5 h-3.5 text-yellow-500" />
              <span className="tracking-tight font-medium">AI Powered Planning OS</span>
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.05] bg-gradient-to-br from-neutral-900 via-neutral-700 to-neutral-500 dark:from-white dark:via-neutral-200 dark:to-neutral-400 bg-clip-text text-transparent">
              Plan. Iterate. Ship. Faster with <span className="whitespace-nowrap">Architect AI</span>
            </h1>
            <p className="mt-6 text-lg text-neutral-600 dark:text-neutral-400 leading-relaxed">
              Turn raw product ideas into an actionable, prioritized engineering roadmap in minutes. Generate tasks, phases, estimates & refine collaboratively — all in one place.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 lg:justify-start justify-center">
              <Magnetic>
                <ShinyButton onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}>
                  Explore Features
                </ShinyButton>
              </Magnetic>
              <Magnetic strength={35}>
                <div><AuthButton /></div>
              </Magnetic>
            </div>
            <p className="mt-4 text-xs text-neutral-500">No credit card • Instant GitHub sign-in</p>
          </div>
          <motion.div style={{ y: yCode }} className="relative">
            <FloatingPanels />
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

export function FeatureGrid() {
  const features = [
    {
      icon: <Workflow className="w-5 h-5" />, title: 'End-to-End Plan', desc: 'Scope, requirements, architecture, tasks & timelines auto-generated.'
    },
    {
      icon: <Brain className="w-5 h-5" />, title: 'AI Refinement', desc: 'Target any section and iterate with natural language instructions.'
    },
    {
      icon: <Users className="w-5 h-5" />, title: 'Real-Time Collaboration', desc: 'Invite teammates with granular view / edit roles.'
    },
  ];
  return (
    <section id="features" className="py-20">
      <div className="mx-auto max-w-7xl px-4">
        <div className="relative rounded-3xl border border-white/60 dark:border-white/10 bg-white/70 dark:bg-neutral-900/40 backdrop-blur-md shadow-[0_4px_30px_-8px_rgba(0,0,0,0.18)] overflow-hidden">
          <div className="pointer-events-none absolute inset-0 opacity-60 mix-blend-overlay bg-[radial-gradient(circle_at_25%_20%,rgba(255,255,255,0.8),transparent_60%),radial-gradient(circle_at_80%_75%,rgba(236,72,153,0.25),transparent_65%)] dark:bg-[radial-gradient(circle_at_25%_20%,rgba(255,255,255,0.08),transparent_60%),radial-gradient(circle_at_80%_75%,rgba(236,72,153,0.18),transparent_65%)]" />
          <div className="relative p-8 md:p-12">
            <div className="grid md:grid-cols-3 gap-8">
              {features.map(f => (
                <motion.div key={f.title} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-80px' }} transition={{ duration: 0.5 }} className="relative group rounded-2xl border border-white/50 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur-sm p-6 hover:shadow-lg hover:-translate-y-1 transition-all">
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/0 via-purple-500/0 to-pink-500/0 opacity-0 group-hover:opacity-100 group-hover:from-blue-500/10 group-hover:via-purple-500/10 group-hover:to-pink-500/10 transition-colors" />
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-blue-600 to-purple-600 text-white flex items-center justify-center shadow mb-4">
                    {f.icon}
                  </div>
                  <h3 className="font-semibold text-lg mb-2 tracking-tight">{f.title}</h3>
                  <p className="text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">{f.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function CTA() {
  return (
    <div className="py-24 bg-gradient-to-b from-transparent via-neutral-50/60 dark:via-neutral-900/30 to-transparent">
      <div className="mx-auto max-w-3xl text-center px-4">
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">Ship with architectural clarity</h2>
        <p className="text-neutral-600 dark:text-neutral-400 text-lg leading-relaxed mb-8">Avoid missed edge cases and rework. Architect AI gives you a living, adaptable blueprint for execution.</p>
        <div className="flex justify-center"><AuthButton /></div>
        <p className="mt-3 text-xs text-neutral-500">Start free. Upgrade later.</p>
      </div>
    </div>
  );
}
