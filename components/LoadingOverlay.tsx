"use client";

import * as React from 'react';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';

export interface LoadingOverlayProps extends React.HTMLAttributes<HTMLDivElement> {
  message?: string;
  fullscreen?: boolean;
}

// A translucent overlay with a centered enhanced spinner.
export function LoadingOverlay({ message = 'Loading', fullscreen = true, className, ...rest }: LoadingOverlayProps) {
  return (
    <div
      className={cn(
        'pointer-events-none select-none flex items-center justify-center',
        fullscreen ? 'fixed inset-0 z-[100]' : 'absolute inset-0',
      )}
      aria-live="polite"
      {...rest}
    >
      {/* Background glass & subtle pattern */}
      <div className="absolute inset-0 bg-background/70 backdrop-blur-sm [mask:linear-gradient(to_bottom,rgba(0,0,0,0.65),rgba(0,0,0,0.8))]" />
      <div className="absolute inset-0 opacity-[0.08] mix-blend-overlay bg-[linear-gradient(120deg,theme(colors.violet.500/.35),transparent_40%,theme(colors.fuchsia.500/.35))]" />
      <div className="relative px-6 py-6 rounded-2xl border border-border/60 shadow-2xl bg-gradient-to-br from-background/90 to-background/70 backdrop-blur-xl flex flex-col items-center gap-4 pointer-events-auto">
        <Spinner size="lg" label={message} showLabel />
        <div className="flex flex-col items-center gap-1">
          <p className="text-sm font-medium text-foreground/90">{message}</p>
          <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-muted-foreground/80">Please wait</p>
        </div>
      </div>
    </div>
  );
}

export default LoadingOverlay;
