"use client";
import React from 'react';
import { Highlight as PrismHighlight, themes } from 'prism-react-renderer';
import type { Language } from 'prism-react-renderer';
import { cn } from '@/lib/utils';

interface CodeBlockProps {
  code: string;
  language?: Language;
  className?: string;
  showLineNumbers?: boolean;
  copyButton?: boolean;
  wrap?: boolean;
}

export function CodeBlock({ code, language = 'bash', className, showLineNumbers = false, copyButton = true, wrap = false }: CodeBlockProps) {
  const [copied, setCopied] = React.useState(false);
  const isDark = typeof document !== 'undefined' ? document.documentElement.classList.contains('dark') : false;
  const lines = code.replace(/\n$/, '').split(/\n/);

  const handleCopy = async () => {
    try { await navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch { }
  };

  return (
    <div className={cn('relative group rounded-lg ring-1 ring-neutral-800/70 dark:ring-neutral-700 bg-neutral-900 text-neutral-100 text-[11px] shadow-inner overflow-hidden', className)}>
      {copyButton && (
        <button
          type="button"
          onClick={handleCopy}
          className="absolute top-2 right-2 z-10 inline-flex items-center rounded-md bg-neutral-800/80 hover:bg-neutral-700 text-neutral-200 px-2 py-0.5 text-[10px] font-medium ring-1 ring-white/10"
        >{copied ? 'Copied' : 'Copy'}</button>
      )}
      <PrismHighlight theme={isDark ? themes.vsDark : themes.github} code={code} language={language}>
        {({ className: inherited, style, tokens, getLineProps, getTokenProps }: any) => (
          <pre className={cn('m-0 overflow-auto p-4', wrap && 'whitespace-pre-wrap break-words', inherited)} style={style as React.CSSProperties}>
            {tokens.map((line: any, i: number) => (
              <div key={i} {...getLineProps({ line, key: i })}>
                {showLineNumbers && <span className="select-none opacity-40 pr-3 inline-block w-6 text-right">{i + 1}</span>}
                {line.map((token: any, key: number) => <span key={key} {...getTokenProps({ token, key })} />)}
              </div>
            ))}
          </pre>
        )}
      </PrismHighlight>
    </div>
  );
}
