import './globals.css';
import type { Metadata } from 'next';
import { SessionProvider } from '@/components/SessionProvider';
import { ThemeProvider } from '@/components/ThemeProvider';
import React from 'react';
import { Manrope, JetBrains_Mono } from 'next/font/google';

const manrope = Manrope({ subsets: ['latin'], variable: '--font-sans', display: 'swap', weight: ['400', '500', '600', '700', '800'] });
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' });

export const metadata: Metadata = {
  title: 'Architect AI',
  description: 'A cutting-edge AI tool for developers to help them build better applications faster.',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/favicon.ico',
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${manrope.variable} ${mono.variable}`}>
      <body className="font-sans antialiased selection:bg-purple-500/20 selection:text-purple-600 h-full overflow-hidden">
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/favicon.ico" />
        <ThemeProvider>
          <SessionProvider>
            {children}
          </SessionProvider>
        </ThemeProvider>
        <div id="portal-root" />
      </body>
    </html>
  );
}
