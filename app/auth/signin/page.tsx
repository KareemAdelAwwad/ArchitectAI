'use client';

import { signIn, getProviders } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Github, Target, Sparkles, ShieldCheck, Wand2, Loader2 } from 'lucide-react';
import OrbBackground from '@/components/ui/orb-background';
import Spinner from '@/components/ui/spinner';

interface ProviderRecord {
  id: string;
  name: string;
  type?: string;
  signinUrl?: string;
}

export default function SignIn() {
  const [providers, setProviders] = useState<Record<string, ProviderRecord> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [signingIn, setSigningIn] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        const res = await getProviders();
        if (!cancelled) setProviders(res as any);
      } catch (e) {
        if (!cancelled) setError('Unable to load sign-in providers.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const providerIcon = (providerId: string) => {
    switch (providerId.toLowerCase()) {
      case 'github':
        return <Github className="w-4 h-4" aria-hidden />;
      default:
        return <Sparkles className="w-4 h-4" aria-hidden />;
    }
  };

  const handleSignIn = async (provider: ProviderRecord) => {
    setSigningIn(provider.id);
    try {
      await signIn(provider.id, { callbackUrl: '/' });
    } catch (e) {
      setSigningIn(null);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-indigo-50 to-blue-100 dark:from-[#0b0c10] dark:via-[#0d1022] dark:to-[#0f162f]">
      {/* Decorative background */}
      <div className="absolute inset-0 overflow-hidden">
        <OrbBackground hue={300} hoverIntensity={0.35} />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.6),transparent_60%)] dark:bg-[radial-gradient(circle_at_30%_20%,rgba(80,40,180,0.25),transparent_60%)] pointer-events-none" />
        <div className="absolute inset-0 backdrop-blur-[2px]" />
      </div>

      <main className="relative z-10 flex flex-1 w-full">
        <section className="hidden lg:flex w-1/2 xl:w-7/12 p-12 2xl:p-20 flex-col justify-center">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/70 dark:bg-white/10 px-4 py-1 text-xs font-medium tracking-wide backdrop-blur border border-white/40 dark:border-white/10 shadow-sm mb-6">
              <Wand2 className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
              AI-Powered Architecture Planning
            </div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl leading-tight bg-gradient-to-br from-slate-900 via-violet-700 to-indigo-600 dark:from-white dark:via-violet-300 dark:to-indigo-300 bg-clip-text text-transparent">
              Accelerate your software architecture decisions
            </h1>
            <p className="mt-6 text-base text-slate-600 dark:text-slate-300/80 leading-relaxed">
              ArchitectAI helps you explore solution patterns, refine system components, and align stakeholders faster. Pick up where you left off and keep momentum with collaborative, traceable plans.
            </p>
            <ul className="mt-8 space-y-4 text-sm text-slate-700 dark:text-slate-300/90">
              <li className="flex items-start gap-3"><ShieldCheck className="w-4 h-4 mt-0.5 text-emerald-500" /> Secure OAuth sign-in with granular privacy</li>
              <li className="flex items-start gap-3"><Sparkles className="w-4 h-4 mt-0.5 text-violet-500" /> Guided AI plan refinement for each phase</li>
              <li className="flex items-start gap-3"><Target className="w-4 h-4 mt-0.5 text-indigo-500" /> Focused outcomes, metrics & export-ready docs</li>
            </ul>
            <p className="mt-10 text-xs text-slate-500 dark:text-slate-400">By continuing you agree to our Terms & Privacy. No spam, ever.</p>
          </div>
        </section>

        <section className="flex w-full lg:w-1/2 xl:w-5/12 items-center justify-center p-6 sm:p-8 md:p-12">
          <Card className="relative w-full max-w-md overflow-hidden backdrop-blur-xl bg-white/80 dark:bg-neutral-900/70 border-white/40 dark:border-white/10 shadow-xl">
            <div className="absolute inset-0 opacity-60 dark:opacity-40 [mask-image:linear-gradient(to_bottom,black,transparent)] pointer-events-none bg-gradient-to-br from-violet-300/40 via-transparent to-indigo-200/40 dark:from-violet-600/20 dark:to-indigo-500/10" />
            <CardHeader className="text-center relative">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-violet-500 via-indigo-500 to-blue-600 rounded-2xl mb-5 mx-auto shadow-lg ring-1 ring-white/40 dark:ring-white/10">
                <Target className="w-8 h-8 text-white drop-shadow" />
              </div>
              <CardTitle className="text-2xl">Welcome back</CardTitle>
              <CardDescription className="leading-relaxed">
                Sign in to access & evolve your architecture plans
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 relative">
              {loading && (
                <div className="flex flex-col items-center gap-4 py-8">
                  <Spinner size="md" label="Loading providers" />
                  <p className="text-xs text-muted-foreground">Loading secure sign-in options…</p>
                </div>
              )}
              {!loading && error && (
                <div className="text-center py-6 text-sm text-red-600 dark:text-red-400">
                  {error}
                </div>
              )}
              {!loading && !error && providers && (
                <div className="space-y-3">
                  {Object.values(providers).map((provider) => (
                    <Button
                      key={provider.id}
                      disabled={!!signingIn}
                      onClick={() => handleSignIn(provider)}
                      variant="outline"
                      className="w-full relative group h-11 font-medium tracking-wide overflow-hidden"
                    >
                      <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-r from-violet-500/10 via-indigo-500/10 to-transparent" />
                      <span className="flex items-center justify-center gap-2 relative">
                        {signingIn === provider.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          providerIcon(provider.id)
                        )}
                        <span>{signingIn === provider.id ? 'Signing in…' : `Sign in with ${provider.name}`}</span>
                      </span>
                    </Button>
                  ))}
                </div>
              )}
            </CardContent>
            <CardFooter className="flex flex-col items-center gap-4 relative">
              <div className="h-px w-full bg-gradient-to-r from-transparent via-slate-300/60 dark:via-slate-600/40 to-transparent" />
              <p className="text-[11px] text-center text-muted-foreground leading-relaxed px-4">
                We never post without permission. OAuth is used only to identify your workspace & sync your planning data.
              </p>
            </CardFooter>
          </Card>
        </section>
      </main>
    </div>
  );
}