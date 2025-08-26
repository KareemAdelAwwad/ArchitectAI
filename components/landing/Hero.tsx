"use client";
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, Workflow, Users, Brain } from 'lucide-react';
import AuthButton from '@/components/AuthButton';
import { Button } from '@/components/ui/button';

// Simple hero section with subtle animations
export function Hero() {
  return (
    <div className="relative py-24 sm:py-32 overflow-hidden">
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-background/60" />
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[600px] w-[1200px] rounded-full bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 blur-3xl opacity-70" />
      </div>
      <div className="mx-auto max-w-6xl px-4">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="text-center max-w-3xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium mb-6 bg-background/60 backdrop-blur">
            <Sparkles className="w-3.5 h-3.5 text-yellow-500" />
            <span className="tracking-tight font-medium">AI Powered Planning OS</span>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.05] bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-600 dark:from-white dark:via-neutral-200 dark:to-neutral-400 bg-clip-text text-transparent">
            Plan. Iterate. Ship. Faster with <span className="whitespace-nowrap">ArchitectAI</span>
          </h1>
          <p className="mt-6 text-lg text-neutral-600 dark:text-neutral-400 leading-relaxed">
            Turn raw product ideas into an actionable, prioritized engineering roadmap in minutes.
            Generate tasks, phases, estimates & refine collaboratively — all in one place.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="gap-2 group" onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}>
              Explore Features <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Button>
            <AuthButton />
          </div>
          <p className="mt-4 text-xs text-neutral-500">No credit card • Instant GitHub sign-in</p>
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
    <div id="features" className="py-20 border-t border-neutral-200/70 dark:border-neutral-800/70">
      <div className="mx-auto max-w-6xl px-4">
        <div className="grid md:grid-cols-3 gap-8">
          {features.map(f => (
            <motion.div key={f.title} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-80px' }} transition={{ duration: 0.5 }} className="relative group rounded-2xl border bg-gradient-to-br from-background to-background/60 p-6 hover:shadow-lg hover:-translate-y-1 transition-all">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/0 via-purple-500/0 to-pink-500/0 opacity-0 group-hover:opacity-100 group-hover:from-blue-500/5 group-hover:via-purple-500/5 group-hover:to-pink-500/5 transition-colors" />
              <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-blue-600 to-purple-600 text-white flex items-center justify-center shadow mb-4">
                {f.icon}
              </div>
              <h3 className="font-semibold text-lg mb-2 tracking-tight">{f.title}</h3>
              <p className="text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function CTA() {
  return (
    <div className="py-24">
      <div className="mx-auto max-w-3xl text-center px-4">
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">Ship with architectural clarity</h2>
        <p className="text-neutral-600 dark:text-neutral-400 text-lg leading-relaxed mb-8">Avoid missed edge cases and rework. ArchitectAI gives you a living, adaptable blueprint for execution.</p>
        <div className="flex justify-center"><AuthButton /></div>
        <p className="mt-3 text-xs text-neutral-500">Start free. Upgrade later.</p>
      </div>
    </div>
  );
}
