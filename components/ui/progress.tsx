'use client';

// Replaced Radix Progress (was causing build syntax error in compiled chunk) with a lightweight custom implementation.
// Accessible, supports determinate & indeterminate states.

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number | null; // null/undefined => indeterminate
  max?: number; // default 100
}

const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);

export const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ value = 0, max = 100, className, children, ...rest }, ref) => {
    const isIndeterminate = value == null || Number.isNaN(value);
    const pct = isIndeterminate ? 0 : clamp(value, 0, max);
    return (
      <div
        ref={ref}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={isIndeterminate ? undefined : pct}
        aria-valuetext={isIndeterminate ? 'Loading' : `${Math.round((pct / max) * 100)}%`}
        data-state={isIndeterminate ? 'indeterminate' : pct >= max ? 'complete' : 'loading'}
        className={cn('relative h-4 w-full overflow-hidden rounded-full bg-secondary', className)}
        {...rest}
      >
        <div
          className={cn(
            'h-full w-full flex-1 bg-primary transition-transform duration-300',
            isIndeterminate && 'animate-pulse'
          )}
          style={{
            transform: isIndeterminate ? undefined : `translateX(-${100 - (pct / max) * 100}%)`,
          }}
        />
        {children}
      </div>
    );
  }
);
Progress.displayName = 'Progress';

export default Progress;
