"use client";
import Link from 'next/link';

// Full-bleed minimal glass footer (no side gaps / dark edges)
export default function LandingFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="relative">
      {/* subtle gradient wash to merge with background */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,rgba(255,255,255,0.55),rgba(255,255,255,0)_60%)] dark:bg-[linear-gradient(to_top,rgba(0,0,0,0.4),rgba(0,0,0,0)_60%)]" />
      <div className="relative w-full border-t border-white/40 dark:border-white/10 bg-white/55 dark:bg-neutral-900/35 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-6 md:px-10 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[13px] font-medium tracking-tight text-neutral-800 dark:text-neutral-100">© {year} Architect AI</p>
          <div className="flex items-center gap-6 text-[12px] text-neutral-600 dark:text-neutral-400">
            <Link href="/auth/signin" className="hover:text-neutral-900 dark:hover:text-neutral-200 transition-colors">Sign In</Link>
            <Link href="https://kareem-adel.com" target="_blank" className="hover:text-neutral-900 dark:hover:text-neutral-200 transition-colors">Creator</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
