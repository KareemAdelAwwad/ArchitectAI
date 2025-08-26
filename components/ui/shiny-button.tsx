"use client";
import * as React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

// Inspired by React Bits "ShinyButton" pattern
const shinyButton = cva(
  'relative inline-flex items-center justify-center font-medium rounded-md transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 disabled:opacity-50 disabled:pointer-events-none text-sm h-11 px-6',
  { variants: { variant: { default: 'text-white bg-neutral-900 dark:bg-white dark:text-neutral-900', ghost: 'bg-transparent text-neutral-900 dark:text-neutral-100' } }, defaultVariants: { variant: 'default' } }
);

export interface ShinyButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> { variant?: 'default' | 'ghost'; }

export const ShinyButton = React.forwardRef<HTMLButtonElement, ShinyButtonProps>(function ShinyButton({ className, children, variant, ...props }, ref) {
  return (
    <button ref={ref} className={cn(shinyButton({ variant }), 'overflow-hidden group', className)} {...props}>
      <span className="absolute inset-0 rounded-md bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 opacity-90" />
      <span className="absolute inset-0 rounded-md [mask-image:radial-gradient(circle_at_30%_30%,white,transparent)] bg-[linear-gradient(110deg,rgba(255,255,255,.35),45%,rgba(255,255,255,0),55%,rgba(255,255,255,.35))] bg-[length:200%_100%] animate-[shimmer_2.5s_infinite]" />
      <span className="relative flex items-center gap-2">
        {children}
        <svg className="w-3.5 h-3.5 opacity-70 group-hover:translate-x-0.5 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
      </span>
    </button>
  );
});

// Tailwind keyframes (ensure added globally if not already); if not present, user can add to tailwind config.
// @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
