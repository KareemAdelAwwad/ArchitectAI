"use client";

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  label?: string; // Accessible label (visually hidden unless showLabel)
  showLabel?: boolean; // If true, renders the label visibly under spinner
  variant?: 'default' | 'secondary' | 'subtle';
}

const sizeMap: Record<NonNullable<SpinnerProps['size']>, string> = {
  xs: 'w-4 h-4',
  sm: 'w-5 h-5',
  md: 'w-8 h-8',
  lg: 'w-12 h-12',
  xl: 'w-16 h-16'
};

// Spinner uses 3 layered elements for richer motion without heavy SVG:
// 1. Track ring
// 2. Animated arc (rotating)
// 3. Soft internal glow pulsing
// Uses CSS vars for color so it adapts to light/dark.

export const Spinner = React.forwardRef<HTMLDivElement, SpinnerProps>(
  ({ size = 'md', label = 'Loading', showLabel = false, variant = 'default', className, ...rest }, ref) => {
    const sizeClass = sizeMap[size];
    const colorClasses =
      variant === 'secondary'
        ? '[--spinner-accent:theme(colors.indigo.500)] dark:[--spinner-accent:theme(colors.indigo.400)]'
        : variant === 'subtle'
          ? '[--spinner-accent:theme(colors.neutral.400)] dark:[--spinner-accent:theme(colors.neutral.500)]'
          : '[--spinner-accent:theme(colors.violet.500)] dark:[--spinner-accent:theme(colors.violet.400)]';
    return (
      <div
        ref={ref}
        role="status"
        aria-live="polite"
        aria-label={label}
        className={cn('inline-flex flex-col items-center justify-center gap-2', className)}
        {...rest}
      >
        <div className={cn('relative', sizeClass, colorClasses)}>
          {/* Base track */}
          <div className="absolute inset-0 rounded-full border-[3px] border-muted/40 dark:border-muted/30" />
          {/* Arc */}
          <div
            className={cn(
              'absolute inset-0 rounded-full border-[3px] border-transparent',
              // Use a dual-colored arc (top + right) for dynamic look
              'border-t-[3px] border-r-[3px] border-t-[var(--spinner-accent)] border-r-[var(--spinner-accent)]',
              // Custom easing & speed
              'animate-[spin_0.8s_cubic-bezier(.55,.3,.3,.9)_infinite]'
            )}
          />
          {/* Inner soft pulse */}
          <div className="absolute inset-1 rounded-full bg-[radial-gradient(circle_at_30%_30%,var(--spinner-accent)_0%,transparent_70%)] opacity-40 animate-[pulse_2s_ease-in-out_infinite] blur-[1px]" />
          {/* Halo */}
          <div className="absolute -inset-1 rounded-full bg-[conic-gradient(from_0deg,var(--spinner-accent),transparent_50%,var(--spinner-accent))] opacity-20 blur-md animate-[spin_3.2s_linear_infinite]" />
          <span className="sr-only">{label}</span>
        </div>
        {showLabel && (
          <span className="text-xs font-medium text-muted-foreground tracking-wide uppercase">
            {label}
          </span>
        )}
        <style jsx>{`
          @keyframes pulse { 0%,100% { opacity: .35 } 50% { opacity: .7 } }
        `}</style>
      </div>
    );
  }
);
Spinner.displayName = 'Spinner';

export default Spinner;
