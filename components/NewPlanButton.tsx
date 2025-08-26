'use client';

import { Plus } from 'lucide-react';
import React from 'react';
import Link from 'next/link';

interface NewPlanButtonProps {
  onClick?: () => void;
  href?: string;
  className?: string;
}

export const NewPlanButton: React.FC<NewPlanButtonProps> = ({ onClick, href, className }) => {
  const commonClasses = `group relative w-full overflow-hidden rounded-md border border-primary/40 dark:border-primary/60 bg-gradient-to-br from-primary/90 via-primary to-primary/80 dark:from-primary/70 dark:via-primary/60 dark:to-primary/80 px-4 py-3 text-sm font-medium text-primary-foreground shadow-[0_4px_18px_-4px_hsl(var(--primary)/0.45)] dark:shadow-[0_4px_18px_-6px_hsl(var(--primary)/0.35)] transition duration-300 hover:shadow-[0_6px_24px_-6px_hsl(var(--primary)/0.55)] dark:hover:shadow-[0_6px_28px_-8px_hsl(var(--primary)/0.45)] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 active:scale-[0.985] ${className || ''}`.trim();
  const inner = (
    <>
      <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-[radial-gradient(circle_at_30%_20%,hsl(var(--primary)/0.25),transparent_60%)] dark:bg-[radial-gradient(circle_at_30%_20%,hsl(var(--primary)/0.35),transparent_60%)]" />
      <span className="absolute -inset-px pointer-events-none [mask:linear-gradient(to_bottom,white,transparent_60%)] bg-[linear-gradient(110deg,hsl(var(--primary)/0.30),transparent_40%,transparent_60%,hsl(var(--primary)/0.30))] dark:bg-[linear-gradient(110deg,hsl(var(--primary)/0.50),transparent_40%,transparent_60%,hsl(var(--primary)/0.50))] bg-[length:200%_100%] animate-[shimmer_5s_linear_infinite] opacity-70" />
      <span className="relative flex items-center justify-center gap-2">
        <span className="relative flex h-7 w-7 items-center justify-center rounded-full bg-white/15 dark:bg-white/10 backdrop-blur-sm ring-1 ring-inset ring-white/30 dark:ring-white/20 shadow-inner overflow-hidden">
          <Plus className="h-4 w-4 text-white drop-shadow-sm transition-transform duration-500 group-hover:rotate-90" />
          <span className="absolute inset-0 bg-primary/40 dark:bg-primary/50 opacity-0 group-hover:opacity-100 transition-opacity" />
        </span>
        <span className="tracking-tight text-white dark:text-black text-lg">New Plan</span>
      </span>
    </>
  );
  if (href) {
    return (
      <Link href={href} onClick={onClick} className={commonClasses} aria-label="Create new plan (navigate home)">
        {inner}
      </Link>
    );
  }
  return (
    <button onClick={onClick} className={commonClasses} aria-label="Create new plan">
      {inner}
    </button>
  );
};

export default NewPlanButton;
