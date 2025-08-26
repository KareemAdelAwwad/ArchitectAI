"use client";

import { useState, useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { ShinyButton } from '@/components/ui/shiny-button';
import { Hero, FeatureGrid, CTA } from '@/components/landing/Hero';
import ScreenshotsShowcase from '@/components/landing/ScreenshotsShowcase';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, Clock, Users, Target, AlertTriangle, Database, Code, Smartphone, Server, Zap, Download, Wand2, Eye, EyeOff, Brain, Info, RotateCcw, Sparkles, ListChecks, AlertCircle } from 'lucide-react';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import OrbBackground from '@/components/ui/orb-background';
import AuthButton from '@/components/AuthButton';
import Sidebar from '@/components/Sidebar';
import { usePathname } from 'next/navigation';
import ProjectInputForm from '@/components/ProjectInputForm';
import TaskList from '@/components/TaskList';
import PhaseResults from '@/components/PhaseResults';
import ExportPlanButton from '@/components/ExportPlanButton';
import { TopNav } from '@/components/TopNav';
// import { generateProjectPlan } from '@/lib/projectPlanner';
import { ProjectInput, ProjectPlan } from '@/types/project';
import PlanOverviewHero from '@/components/PlanOverviewHero';
import PlanMetrics from '@/components/PlanMetrics';
import DarkVeil from '@/components/ui/DarkVeil';
import Link from 'next/link';
import LandingFooter from '@/components/LandingFooter';
import { toast } from '@/hooks/use-toast';

// NOTE: Moved HomeClient to components/HomeClient.tsx for type isolation.
// Keeping implementation here to avoid large refactor; removing named export to satisfy Next type checker.
type HomeInit = {
  initialPlan?: ProjectPlan;
  initialPlanId?: string;
  initialIsOwner?: boolean;
  initialCollaboratorRole?: 'viewer' | 'editor' | null;
};
declare global { interface Window { __HOME_INIT__?: HomeInit; } }
function HomeClientInternal() {
  // Read any server-provided initial state injected by /plans/[id] page via window global.
  const init = (typeof window !== 'undefined' ? (window.__HOME_INIT__ || {}) : {}) as HomeInit;
  const initialPlan = init.initialPlan;
  const initialPlanId = init.initialPlanId;
  const initialIsOwner = init.initialIsOwner ?? false;
  const initialCollaboratorRole = init.initialCollaboratorRole ?? null;
  const { data: session, status } = useSession();
  // Hook for forcing dark theme on unauthenticated landing
  const { setTheme } = useTheme();
  const [currentStep, setCurrentStep] = useState<'input' | 'processing' | 'results'>(initialPlan ? 'results' : 'input');
  const [projectPlan, setProjectPlan] = useState<ProjectPlan | null>(initialPlan ?? null);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [currentPlanId, setCurrentPlanId] = useState<string | null>(initialPlanId ?? null);
  const [isOwner, setIsOwner] = useState<boolean>(false);
  const [collaboratorRole, setCollaboratorRole] = useState<'viewer' | 'editor' | null>(initialCollaboratorRole);
  const [collaborators, setCollaborators] = useState<Array<{ userId: string; role: 'viewer' | 'editor'; name?: string | null; image?: string | null }>>([]);
  const [showMetadata, setShowMetadata] = useState<boolean>(true);
  const [metaPrefLoaded, setMetaPrefLoaded] = useState(false);
  const [savingTechStack, setSavingTechStack] = useState(false);

  useEffect(() => {
    if (initialPlanId) {
      setIsOwner(initialIsOwner);
      setCollaboratorRole(initialCollaboratorRole);
    }
  }, [initialPlanId, initialIsOwner, initialCollaboratorRole]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  // persist sidebar collapse state
  useEffect(() => {
    try {
      const saved = localStorage.getItem('sidebarCollapsed');
      if (saved !== null) setSidebarCollapsed(saved === 'true');
      const metaPref = localStorage.getItem('showPlanMetadata');
      if (metaPref !== null) setShowMetadata(metaPref === 'true');
    } catch { }
    setMetaPrefLoaded(true);
  }, []);
  useEffect(() => {
    try { localStorage.setItem('sidebarCollapsed', String(sidebarCollapsed)); } catch { }
  }, [sidebarCollapsed]);
  useEffect(() => {
    if (!metaPrefLoaded) return; // avoid writing before initial load
    try { localStorage.setItem('showPlanMetadata', String(showMetadata)); } catch { }
  }, [showMetadata, metaPrefLoaded]);
  const [editSection, setEditSection] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [aiInstruction, setAiInstruction] = useState('');
  const [isRefining, setIsRefining] = useState(false);
  const [loadingQuickStart, setLoadingQuickStart] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [parseOk, setParseOk] = useState<boolean | null>(null);
  const [parseMessage, setParseMessage] = useState<string>('');
  const [originalSnapshot, setOriginalSnapshot] = useState<string>('');
  const instructionSuggestions = [
    'Add more detailed API Endpoints that cover all use cases',
    'Add more detailed Database Schemas that cover all use cases',
    'Add performance optimization tasks',
    'Clarify database indexing strategy',
    'Include accessibility considerations',
    'Refine API error handling details',
    'Add security hardening steps'
  ];

  // Derive JSON pointer-like options for refinement
  const editableSections = [
    'tasks.frontend',
    'tasks.backend',
    'tasks.integration',
    'tasks.deployment',
    'waterfallPhases.planning.scope',
    'waterfallPhases.planning.objectives',
    'waterfallPhases.planning.stakeholders',
    'waterfallPhases.planning.resources',
    'waterfallPhases.planning.risks',
    'waterfallPhases.analysis.functionalRequirements',
    'waterfallPhases.analysis.nonFunctionalRequirements',
    'waterfallPhases.analysis.userStories',
    'waterfallPhases.analysis.constraints',
    'waterfallPhases.analysis.integrations',
    'waterfallPhases.design.systemArchitecture',
    'waterfallPhases.design.databaseSchema',
    'waterfallPhases.design.apiEndpoints',
    'waterfallPhases.design.uiDesign',
    'waterfallPhases.design.codingStandards'
  ];

  const sectionLabels: Record<string, string> = {
    'tasks.frontend': 'Tasks – Frontend',
    'tasks.backend': 'Tasks – Backend',
    'tasks.integration': 'Tasks – Integration & Testing',
    'tasks.deployment': 'Tasks – Deployment & DevOps',
    'waterfallPhases.planning.scope': 'Planning – Project Scope',
    'waterfallPhases.planning.objectives': 'Planning – Objectives',
    'waterfallPhases.planning.stakeholders': 'Planning – Stakeholders',
    'waterfallPhases.planning.resources': 'Planning – Resources',
    'waterfallPhases.planning.risks': 'Planning – Risks',
    'waterfallPhases.analysis.functionalRequirements': 'Analysis – Functional Requirements',
    'waterfallPhases.analysis.nonFunctionalRequirements': 'Analysis – Non-Functional Requirements',
    'waterfallPhases.analysis.userStories': 'Analysis – User Stories',
    'waterfallPhases.analysis.constraints': 'Analysis – Constraints',
    'waterfallPhases.analysis.integrations': 'Analysis – External Integrations',
    'waterfallPhases.design.systemArchitecture': 'Design – System Architecture',
    'waterfallPhases.design.databaseSchema': 'Design – Database Schema',
    'waterfallPhases.design.apiEndpoints': 'Design – API Endpoints',
    'waterfallPhases.design.uiDesign': 'Design – UI / UX',
    'waterfallPhases.design.codingStandards': 'Design – Coding Standards'
  };

  const openManualEdit = (section: string) => {
    if (!projectPlan) return;
    setEditSection(section);
    // Extract current value into text (pretty JSON for tasks, newline list for arrays)
    const value = section.split('.').reduce<any>((acc, key) => acc && acc[key], projectPlan);
    if (Array.isArray(value) && value.length && typeof value[0] === 'object') {
      setEditText(JSON.stringify(value, null, 2));
      setOriginalSnapshot(JSON.stringify(value, null, 2));
    } else if (Array.isArray(value)) {
      setEditText(value.join('\n'));
      setOriginalSnapshot(value.join('\n'));
    } else {
      setEditText(typeof value === 'string' ? value : JSON.stringify(value, null, 2));
      setOriginalSnapshot(typeof value === 'string' ? value : JSON.stringify(value, null, 2));
    }
    setParseOk(null);
    setParseMessage('');
  };

  const applyManualEdit = () => {
    if (!projectPlan || !editSection) return;
    const parts = editSection.split('.');
    const newPlan: any = { ...projectPlan, tasks: { ...projectPlan.tasks }, waterfallPhases: { ...projectPlan.waterfallPhases, planning: { ...projectPlan.waterfallPhases.planning }, analysis: { ...projectPlan.waterfallPhases.analysis }, design: { ...projectPlan.waterfallPhases.design } } };
    let cursor = newPlan;
    for (let i = 0; i < parts.length - 1; i++) cursor = cursor[parts[i]];
    const last = parts[parts.length - 1];
    try {
      if (editSection.startsWith('tasks.')) {
        // Expect JSON array of tasks
        const parsed = JSON.parse(editText);
        if (!Array.isArray(parsed)) throw new Error('Tasks section must be a JSON array');
        cursor[last] = parsed.map((t: any) => ({ ...t, completed: !!t.completed }));
      } else if (editSection.startsWith('waterfallPhases.')) {
        // Expect newline separated list -> array
        const arr = editText.split('\n').map(l => l.trim()).filter(Boolean);
        cursor[last] = arr;
      }
      setProjectPlan(newPlan);
      setEditSection(null);
    } catch (e) {
      alert('Failed to parse edit: ' + (e as Error).message);
    }
  };

  // Live parse validation for tasks.* JSON
  useEffect(() => {
    if (!editSection) { setParseOk(null); return; }
    if (editSection.startsWith('tasks.')) {
      try {
        const parsed = JSON.parse(editText);
        if (!Array.isArray(parsed)) throw new Error('Must be an array');
        setParseOk(true);
        setParseMessage(`${parsed.length} task${parsed.length === 1 ? '' : 's'} parsed`);
      } catch (e: any) {
        setParseOk(false);
        setParseMessage(e.message);
      }
    } else if (editSection.startsWith('waterfallPhases.')) {
      const lines = editText.split('\n').map(l => l.trim()).filter(Boolean);
      setParseOk(true);
      setParseMessage(`${lines.length} item${lines.length === 1 ? '' : 's'} detected`);
    } else {
      setParseOk(null);
      setParseMessage('');
    }
  }, [editSection, editText]);

  const revertOriginal = () => {
    if (!originalSnapshot) return;
    setEditText(originalSnapshot);
  };

  const refineWithAI = async () => {
    if (!projectPlan || !editSection) return;
    setIsRefining(true);
    // Enter processing view for refinement for consistent UX
    setIsRefining(true);
    const previousStep = currentStep;
    setCurrentStep('processing');
    setProcessingProgress(0);
    try {
      const res = await fetch('/api/refine-plan-section', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: currentPlanId, fullPlan: currentPlanId ? undefined : projectPlan, section: editSection, instruction: aiInstruction })
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      // Merge into plan
      const parts = data.section.split('.');
      const newPlan: any = { ...projectPlan, tasks: { ...projectPlan.tasks }, waterfallPhases: { ...projectPlan.waterfallPhases, planning: { ...projectPlan.waterfallPhases.planning }, analysis: { ...projectPlan.waterfallPhases.analysis }, design: { ...projectPlan.waterfallPhases.design } } };
      let cursor = newPlan;
      for (let i = 0; i < parts.length - 1; i++) cursor = cursor[parts[i]];
      cursor[parts[parts.length - 1]] = data.value;
      setProjectPlan(newPlan);
      // Refresh editor content with latest
      openManualEdit(data.section);
    } catch (e: any) {
      alert('AI refine failed: ' + e.message);
    } finally {
      setIsRefining(false);
      // Return to results after brief delay to show progress animation
      setTimeout(() => setCurrentStep(previousStep === 'results' ? 'results' : 'results'), 400);
    }
  };

  // Steps for generation (shared with UI display during processing)
  const generationSteps = [
    'Analyzing project scope',
    'Defining stakeholders & objectives',
    'Gathering functional requirements',
    'Designing system architecture',
    'Generating development tasks',
    'Finalizing project plan'
  ];
  const processingStartRef = useRef<number | null>(null);
  const [estimatedRemaining, setEstimatedRemaining] = useState<string>('');
  const MIN_PROCESSING_MS = 60000; // enforce 1 minute experience
  const [pendingPlan, setPendingPlan] = useState<ProjectPlan | null>(null);
  const pendingPlanRef = useRef<ProjectPlan | null>(null);
  useEffect(() => { pendingPlanRef.current = pendingPlan; }, [pendingPlan]);
  useEffect(() => {
    if (currentStep === 'processing') {
      if (!processingStartRef.current) processingStartRef.current = Date.now();
      const interval = setInterval(() => {
        if (!processingStartRef.current) return;
        const elapsed = Date.now() - processingStartRef.current;
        const remainingMs = Math.max(0, MIN_PROCESSING_MS - elapsed);
        const m = Math.floor(remainingMs / 60000);
        const s = Math.floor((remainingMs % 60000) / 1000);
        setEstimatedRemaining(`${m}m ${s.toString().padStart(2, '0')}s remaining`);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      processingStartRef.current = null;
      setEstimatedRemaining('');
    }
  }, [currentStep, processingProgress]);

  const handleProjectSubmit = async (projectInput: ProjectInput) => {
    setCurrentStep('processing');
    setProcessingProgress(0);
    setPendingPlan(null);
    processingStartRef.current = Date.now();

    // Kick off real plan generation in background
    (async () => {
      let plan: ProjectPlan | null = null;
      try {
        const res = await fetch('/api/generate-plan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ input: projectInput })
        });
        if (!res.ok) throw new Error('AI generation failed');
        plan = await res.json();
      } catch (e) {
        console.error('AI generation error, falling back to local planner', e);
        const mod = await import('@/lib/projectPlanner');
        plan = mod.generateProjectPlan(projectInput);
      }
      if (plan) setPendingPlan(plan);
    })();

    // Progress interval
    const interval = setInterval(async () => {
      if (!processingStartRef.current) return;
      const elapsed = Date.now() - processingStartRef.current;
      let pct = (elapsed / MIN_PROCESSING_MS) * 100;
      const planReady = !!pendingPlanRef.current;
      if (planReady && elapsed >= MIN_PROCESSING_MS) {
        pct = 100;
      } else if (pct >= 99) {
        pct = 99; // hold at 99% until both conditions met
      }
      setProcessingProgress(pct);

      if (pct === 100 && planReady) {
        clearInterval(interval);
        const finalPlan = pendingPlanRef.current!;
        setProjectPlan(finalPlan);
        // Save plan only now
        if (session?.user) {
          try {
            const res = await fetch('/api/plans', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({ plan: finalPlan })
            });
            if (res.ok) {
              const saved = await res.json();
              setCurrentPlanId(saved._id);
              window.dispatchEvent(new CustomEvent('plan-saved'));
            } else {
              const text = await res.text();
              console.error('Failed saving plan: status', res.status, 'body', text);
            }
          } catch (error) {
            console.error('Error saving plan:', error);
          }
        }
        setTimeout(() => { setCurrentStep('results'); }, 400); // slight delay for 100% visual
      }
    }, 500);
  };

  const handleStartOver = () => {
    setCurrentStep('input');
    setProjectPlan(null);
    setProcessingProgress(0);
  };

  // Legacy export function removed.

  const handleSelectPlan = (plan: ProjectPlan, id: string) => {
    setProjectPlan(plan);
    setCurrentPlanId(id);
    setCurrentStep('results');
    // Push URL to reflect selected plan without leaving main app
    if (typeof window !== 'undefined') {
      const url = `/plans/${id}`;
      // Use history API to avoid full reload
      window.history.replaceState({ planId: id }, '', url);
    }
    // fetch metadata for permissions
    fetch(`/api/plans/${id}`).then(async r => {
      if (r.ok) {
        const data = await r.json();
        setIsOwner(!!data.isOwner);
        setCollaboratorRole(data.collaboratorRole || null);
        if (Array.isArray(data.collaborators)) setCollaborators(data.collaborators);
      }
    }).catch(() => { });
  };

  const handleTaskToggle = async (taskId: string, completed: boolean) => {
    if (!projectPlan) return;
    // Update local state optimistically
    setProjectPlan(prev => {
      if (!prev) return prev;
      const updateTasksArray = (arr: any[]) => arr.map(t => t.id === taskId ? { ...t, completed } : t);
      return {
        ...prev,
        tasks: {
          frontend: updateTasksArray(prev.tasks.frontend),
          backend: updateTasksArray(prev.tasks.backend),
          integration: updateTasksArray(prev.tasks.integration),
          deployment: updateTasksArray(prev.tasks.deployment),
        }
      };
    });
    if (!currentPlanId) return; // cannot persist without plan id
    try {
      await fetch(`/api/plans/${currentPlanId}/tasks`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, completed })
      });
    } catch (e) {
      console.error('Failed to persist task status', e);
    }
  };

  const pathname = usePathname();
  const canEdit = isOwner || collaboratorRole === 'editor';
  // When navigating back to root '/', treat it as starting a new project (show form)
  useEffect(() => {
    if (pathname === '/') {
      setCurrentStep('input');
      setProjectPlan(null);
      setProcessingProgress(0);
      setCurrentPlanId(null);
    }
  }, [pathname]);
  // Also support custom new-plan event (triggered by sidebar button) in case URL never left Next's root route
  useEffect(() => {
    const handler = () => {
      setCurrentStep('input');
      setProjectPlan(null);
      setProcessingProgress(0);
      setCurrentPlanId(null);
      setEditSection(null);
      setAiInstruction('');
      setEditDialogOpen(false);
    };
    window.addEventListener('new-plan', handler);
    return () => window.removeEventListener('new-plan', handler);
  }, []);

  // Force dark theme any time the user is unauthenticated (must run before any conditional returns to satisfy hook rules)
  useEffect(() => {
    if (!session) {
      try {
        setTheme('dark');
        if (typeof document !== 'undefined') {
          document.documentElement.classList.add('dark');
        }
      } catch { /* swallow */ }
    }
  }, [session, setTheme]);

  // Show sign-in prompt if not authenticated
  if (status === 'loading') {
    return (
      <div className="min-h-screen" data-page>
        <div className="absolute inset-0">
          {/* Enhanced spinner experience */}
          <div className="flex h-full items-center justify-center p-6">
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <div className="absolute -inset-6 animate-[spin_6s_linear_infinite] opacity-40 blur-xl rounded-full bg-[conic-gradient(from_0deg,theme(colors.violet.500/.4),transparent_55%,theme(colors.fuchsia.500/.4))]" />
                <div className="relative">
                  {/* Import lightweight spinner */}
                  {(() => { const Spinner = require('@/components/ui/spinner').Spinner; return <Spinner size="lg" label="Loading session" />; })()}
                </div>
              </div>
              <p className="text-sm text-muted-foreground tracking-wide">Authenticating…</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="h-screen flex flex-col overflow-hidden relative dark" data-page>
        {/* Animated artistic background */}
        <div className="absolute inset-0 -z-10 pointer-events-none select-none">
          <DarkVeil
            hueShift={35}
            noiseIntensity={0.08}
            scanlineIntensity={0.05}
            scanlineFrequency={0.0}
            warpAmount={0.15}
            speed={0.4}
            resolutionScale={1}
          />
          {/* Soft gradient overlay for readability */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.35),transparent_60%),radial-gradient(circle_at_70%_80%,rgba(236,72,153,0.18),transparent_65%)] dark:bg-[radial-gradient(circle_at_30%_20%,rgba(99,102,241,0.25),transparent_60%),radial-gradient(circle_at_70%_80%,rgba(236,72,153,0.25),transparent_65%)] mix-blend-overlay" />
          <div className="absolute inset-0 backdrop-blur-[2px]" />
        </div>
        <TopNav hideThemeToggle />
        {/* Marketing / public landing experience */}
        <main className="flex-1 app-scroll relative">
          <Hero />
          <FeatureGrid />
          <ScreenshotsShowcase />
          <CTA />
        </main>
        <LandingFooter />
      </div>
    );
  }
  if (currentStep === 'input') {
    return (
      <div className="h-screen flex overflow-hidden bg-[radial-gradient(circle_at_30%_20%,rgba(99,102,241,0.12),transparent_60%),radial-gradient(circle_at_70%_70%,rgba(236,72,153,0.1),transparent_55%)] dark:bg-[radial-gradient(circle_at_30%_20%,rgba(99,102,241,0.22),transparent_60%),radial-gradient(circle_at_70%_70%,rgba(236,72,153,0.18),transparent_55%)]" data-page>
        <Sidebar
          onSelectPlan={handleSelectPlan}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
        <div className="flex-1 flex flex-col overflow-hidden relative">
          <TopNav />
          {/* Decorative grid overlay */}
          <div className="pointer-events-none absolute inset-0 opacity-[0.12] [mask-image:linear-gradient(to_bottom,black,75%,transparent)]" style={{ background: 'repeating-linear-gradient(135deg,rgba(255,255,255,0.25)_0,rgba(255,255,255,0.25)_1px,transparent_1px,transparent_7px)' }} />
          <div className="relative flex-1 flex flex-col">
            <div className="w-full px-6 md:px-10 pt-10 pb-4">
              <div className="max-w-7xl mx-auto">
                <h1 className="text-4xl md:text-5xl font-semibold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-fuchsia-400 to-purple-500 drop-shadow-sm">Start Your Project Planning</h1>
                <p className="mt-4 max-w-2xl text-sm md:text-base text-neutral-600 dark:text-neutral-400 leading-relaxed">Craft a production-ready, phased project plan with AI-supported analysis. Provide context and we&apos;ll generate architecture considerations, tasks & metrics. Iterate anytime.</p>
              </div>
            </div>
            {/* Form region */}
            <div className="flex-1 relative overflow-hidden">
              <div className="absolute inset-0 overflow-y-auto app-scroll px-6 md:px-10 pb-24">
                <div className="max-w-7xl mx-auto">
                  {/* Lightweight container for form */}
                  <div className="relative rounded-xl border border-white/20 dark:border-white/10 bg-white/60 dark:bg-neutral-900/40 backdrop-blur-md supports-[backdrop-filter]:bg-white/50 dark:supports-[backdrop-filter]:bg-neutral-900/40 shadow-[0_4px_30px_-8px_rgba(0,0,0,0.3)] p-6 md:p-8">
                    <ProjectInputForm onSubmit={handleProjectSubmit} />
                    {/* Soft gradient accents */}
                    <div className="pointer-events-none absolute -inset-px rounded-[inherit] [background:linear-gradient(120deg,rgba(99,102,241,0.25),rgba(236,72,153,0.25),transparent_70%)] opacity-60 mix-blend-overlay" />
                  </div>
                </div>
              </div>
              {/* Sticky footer actions hint */}
              <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-white/80 dark:from-neutral-950/80 to-transparent" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (currentStep === 'processing') {
    const currentStepIndex = Math.min(generationSteps.length - 1, Math.floor((processingProgress / 100) * generationSteps.length));
    return (
      <div className="h-screen flex overflow-hidden relative" data-page>
        <Sidebar
          onSelectPlan={handleSelectPlan}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
        <div className="flex-1 flex items-center justify-center px-6 py-12 overflow-hidden relative">
          <OrbBackground />
          <div className="w-full max-w-2xl relative">
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-pink-500/10 blur-2xl opacity-70" aria-hidden="true"></div>
            <div className="relative rounded-3xl border border-white/30 dark:border-white/10 bg-white/25 dark:bg-white/10 backdrop-blur-xl supports-[backdrop-filter]:bg-white/25 dark:supports-[backdrop-filter]:bg-white/10 shadow-[0_8px_40px_-10px_rgba(79,70,229,0.35),0_2px_8px_-2px_rgba(236,72,153,0.5)] p-10">
              <div className="flex flex-col items-center text-center mb-8">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center shadow-lg ring-1 ring-black/5 mb-6 animate-pulse">
                  <Zap className="w-10 h-10 text-white" />
                </div>
                <h1 className="text-2xl font-semibold tracking-tight mb-2">Generating Your Project Plan</h1>
                <p className="text-sm text-neutral-100/80 dark:text-neutral-300 max-w-md">This usually takes between <span className="font-medium text-white/90">2–4 minutes</span> depending on project complexity. Feel free to grab a coffee.</p>
              </div>
              <div className="mb-8">
                <div className="h-3 rounded-full bg-white/20 dark:bg-white/10 overflow-hidden backdrop-blur">
                  <div className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 transition-all duration-500 ease-out" style={{ width: `${processingProgress}%` }} />
                </div>
                <div className="flex justify-between text-xs mt-2 text-white/80 font-medium">
                  <span>{processingProgress < 100 ? `${processingProgress.toFixed(0)}%` : '100%'}</span>
                  <span>{processingProgress < 100 ? estimatedRemaining : 'Finalizing...'}</span>
                </div>
              </div>
              <ul className="space-y-3 mb-8">
                {generationSteps.map((s, i) => {
                  const done = i < currentStepIndex;
                  const active = i === currentStepIndex && processingProgress < 100;
                  return (
                    <li key={s} className={`flex items-center gap-3 text-sm rounded-md px-3 py-2 border transition-colors ${done ? 'border-emerald-400/50 bg-emerald-300/10 text-emerald-200 backdrop-blur-sm' : active ? 'border-blue-400/60 bg-blue-300/10 text-blue-200 animate-pulse backdrop-blur-sm' : 'border-white/25 bg-white/5 text-white/70'} `}>
                      <span className="w-5 text-center">
                        {done ? '✓' : active ? '•' : ''}
                      </span>
                      <span className="flex-1 truncate">{s}</span>
                    </li>
                  );
                })}
              </ul>
              <p className="text-xs text-white/60 text-center">Optimizing tasks, phases & estimates with AI models…</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex overflow-hidden" data-page>
      <Sidebar
        onSelectPlan={handleSelectPlan}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <div className={`flex flex-col w-full overflow-hidden transition-all duration-300 ease-out ${sidebarCollapsed ? 'pl-0' : ''}`}>
        <TopNav
          right={projectPlan && currentPlanId ? (
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setShowMetadata(s => {
                    const next = !s; try { localStorage.setItem('showPlanMetadata', String(next)); } catch { }
                    return next;
                  });
                }}
                className="gap-1"
              >
                {showMetadata ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                <span className="hidden sm:inline">{showMetadata ? 'Hide' : 'Show'} Meta</span>
                <span className="sm:hidden">{showMetadata ? 'Hide' : 'Show'}</span>
              </Button>
              {canEdit && (
                <Button size="sm" variant="outline" onClick={() => setEditDialogOpen(true)} className="gap-1">
                  <Wand2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Refine / Edit</span>
                  <span className="sm:hidden">Edit</span>
                </Button>
              )}
              <ExportPlanButton planId={currentPlanId} />
            </div>
          ) : undefined}
        />
        <div className="px-6 pt-8 pb-24 w-full max-w-[100rem] mx-auto space-y-12 flex-1 app-scroll">
          {projectPlan && (
            <>
              {metaPrefLoaded && showMetadata && (
                <div className="space-y-6">
                  <PlanOverviewHero
                    plan={projectPlan}
                    isOwner={isOwner}
                    collaboratorRole={collaboratorRole}
                    collaborators={collaborators}
                    techStackSaving={savingTechStack}
                    onUpdateTechStack={async (stack) => {
                      try {
                        setSavingTechStack(true);
                        if (currentPlanId) {
                          const res = await fetch(`/api/plans/${currentPlanId}/overview`, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ techStack: stack })
                          });
                          if (!res.ok) throw new Error(await res.text());
                        }
                        setProjectPlan(p => p ? ({ ...p, overview: { ...p.overview, techStack: stack } }) : p);
                      } catch (e: any) {
                        alert('Update tech stack failed: ' + e.message);
                      } finally {
                        setSavingTechStack(false);
                      }
                    }}
                  />
                  <PlanMetrics plan={projectPlan} />
                </div>
              )}
              <div>
                <Tabs defaultValue="tasks" className="space-y-6">
                  <TabsList className="relative grid grid-cols-2 w-full rounded-full p-0.5 bg-neutral-100/70 dark:bg-neutral-900/60 backdrop-blur-xl border border-border/60 overflow-hidden before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_25%_15%,rgba(255,255,255,0.6),transparent_55%)] before:dark:bg-[radial-gradient(circle_at_25%_15%,rgba(255,255,255,0.08),transparent_60%)] before:pointer-events-none">
                    <TabsTrigger
                      value="tasks"
                      className="relative w-full rounded-full px-6 py-2 data-[state=active]:bg-white/80 data-[state=active]:dark:bg-neutral-800/70 data-[state=active]:shadow-sm data-[state=active]:text-neutral-900 dark:data-[state=active]:text-neutral-50 data-[state=inactive]:text-neutral-600 dark:data-[state=inactive]:text-neutral-400 transition-all font-medium text-sm overflow-hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500/50"
                    >
                      <span className="relative z-10">Tasks</span>
                      <span className="absolute inset-0 opacity-0 data-[state=active]:opacity-100 bg-[linear-gradient(135deg,var(--tw-gradient-stops))] from-indigo-500/20 via-fuchsia-500/15 to-purple-500/25 dark:from-indigo-400/25 dark:via-fuchsia-400/15 dark:to-purple-400/25 backdrop-blur-sm" />
                      <span className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-indigo-500/0 data-[state=active]:ring-indigo-500/30 rounded-full" />
                    </TabsTrigger>
                    <TabsTrigger
                      value="phases"
                      className="relative w-full rounded-full px-6 py-2 data-[state=active]:bg-white/80 data-[state=active]:dark:bg-neutral-800/70 data-[state=active]:shadow-sm data-[state=active]:text-neutral-900 dark:data-[state=active]:text-neutral-50 data-[state=inactive]:text-neutral-600 dark:data-[state=inactive]:text-neutral-400 transition-all font-medium text-sm overflow-hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500/50"
                    >
                      <span className="relative z-10">Phases</span>
                      <span className="absolute inset-0 opacity-0 data-[state=active]:opacity-100 bg-[linear-gradient(135deg,var(--tw-gradient-stops))] from-indigo-500/20 via-fuchsia-500/15 to-purple-500/25 dark:from-indigo-400/25 dark:via-fuchsia-400/15 dark:to-purple-400/25 backdrop-blur-sm" />
                      <span className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-indigo-500/0 data-[state=active]:ring-indigo-500/30 rounded-full" />
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="tasks" className="space-y-8">
                    <TaskList key={(currentPlanId || projectPlan.overview.title) + ':tasks'} tasks={projectPlan.tasks} onToggleTask={handleTaskToggle} readOnly={!isOwner && collaboratorRole !== 'editor'} />
                  </TabsContent>
                  <TabsContent value="phases" className="space-y-6">
                    <PhaseResults
                      planning={projectPlan.waterfallPhases.planning}
                      analysis={projectPlan.waterfallPhases.analysis}
                      design={projectPlan.waterfallPhases.design}
                      quickStart={projectPlan.waterfallPhases.quickStart}
                      loadingQuickStart={loadingQuickStart}
                      onGenerateQuickStart={async (pm) => {
                        if (loadingQuickStart) return;
                        try {
                          setLoadingQuickStart(true);
                          const res = await fetch('/api/quick-start-phase', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ planId: currentPlanId, fullPlan: currentPlanId ? undefined : projectPlan, packageManager: pm, force: !!projectPlan.waterfallPhases.quickStart })
                          });
                          if (!res.ok) {
                            const raw = await res.text();
                            let msg = raw;
                            try { const j = JSON.parse(raw); if (j.error) msg = j.error; } catch { /* ignore */ }
                            if (/<!DOCTYPE html>/i.test(raw)) {
                              msg = 'Server timeout or network error (HTML error page)';
                            }
                            throw new Error(msg);
                          }
                          const data = await res.json();
                          const qs = data.quickStart;
                          setProjectPlan(p => p ? ({ ...p, waterfallPhases: { ...p.waterfallPhases, quickStart: qs } }) : p);
                          // Browser notification (with graceful fallback) when Quick Start is generated
                          try {
                            if (typeof window !== 'undefined') {
                              const title = 'Quick Start Ready';
                              const body = `The Quick Start phase${projectPlan?.overview?.title ? ' for ' + projectPlan.overview.title : ''} has been generated.`;
                              const showNative = async () => {
                                try {
                                  new Notification(title, { body, tag: 'quick-start-complete' });
                                } catch { /* ignore */ }
                              };
                              if ('Notification' in window) {
                                if (Notification.permission === 'granted') {
                                  showNative();
                                } else if (Notification.permission === 'default') {
                                  try {
                                    const perm = await Notification.requestPermission();
                                    if (perm === 'granted') showNative();
                                  } catch { /* ignored */ }
                                }
                              }
                              // Always show an in-app toast as well for immediate feedback
                              toast({ title, description: body });
                            }
                          } catch { /* non-fatal */ }
                        } catch (e: any) {
                          const msg = e?.message || 'Unknown error';
                          alert('Quick Start generation failed: ' + msg);
                          // Opportunistic refresh: in some cases the generation succeeded but response failed (timeout / 504)
                          if (currentPlanId) {
                            try {
                              const planRes = await fetch(`/api/plans/${currentPlanId}`);
                              if (planRes.ok) {
                                const planData = await planRes.json();
                                if (planData?.plan?.waterfallPhases?.quickStart) {
                                  setProjectPlan(planData.plan);
                                }
                              }
                            } catch { /* ignore refresh errors */ }
                          }
                        } finally {
                          setLoadingQuickStart(false);
                        }
                      }}
                    />
                  </TabsContent>
                </Tabs>
              </div>
              <Dialog open={editDialogOpen} onOpenChange={(o) => { setEditDialogOpen(o); if (!o) { setEditSection(null); setAiInstruction(''); } }}>
                <DialogContent className="max-w-6xl">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      {editSection ? `Edit / Refine: ${sectionLabels[editSection] || editSection}` : 'Refine or Edit Plan Section'}
                      {!(isOwner || collaboratorRole === 'editor') && <Badge variant="outline" className="text-[10px]">Read-only</Badge>}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="grid md:grid-cols-3 gap-6 mt-2">
                    {/* Left column: selection & help */}
                    <div className="space-y-4 md:col-span-1">
                      <div>
                        <label className="text-xs font-medium uppercase tracking-wide flex items-center gap-1 text-neutral-600 dark:text-neutral-400"><ListChecks className="h-3.5 w-3.5" /> Section</label>
                        <Select value={editSection || ''} onValueChange={(v) => openManualEdit(v)}>
                          <SelectTrigger className="mt-1 h-9 w-full text-xs bg-white/70 dark:bg-neutral-800/60 disabled:opacity-50" disabled={!(isOwner || collaboratorRole === 'editor')}>
                            <SelectValue placeholder="Select section..." />
                          </SelectTrigger>
                          <SelectContent className="max-h-72">
                            {editableSections.map(s => <SelectItem key={s} value={s} className="text-xs py-1.5">{sectionLabels[s] || s}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="rounded-md border p-3 bg-white/60 dark:bg-neutral-800/50 space-y-2 text-xs leading-relaxed">
                        <div className="flex items-start gap-2"><Info className="h-4 w-4 text-indigo-500" />
                          <p className="font-medium">Format Guide</p>
                        </div>
                        {editSection?.startsWith('tasks.') ? (
                          <>
                            <p>Provide a JSON array of task objects. Each task may include: title, description, estimateHours, dependencies (array), completed (bool).</p>
                            <p className="font-mono bg-neutral-900/60 text-neutral-200 p-2 rounded text-[10px]">[{`{"title":"Implement auth","estimateHours":6}`}]</p>
                          </>
                        ) : editSection?.startsWith('waterfallPhases.') ? (
                          <p>Enter one item per line. Blank lines are ignored.</p>
                        ) : <p>Select a section to view formatting help.</p>}
                        {parseOk !== null && (
                          <div className={`flex items-center gap-1.5 text-[11px] font-medium ${parseOk ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                            {parseOk ? <CheckCircle className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />} {parseMessage}
                          </div>
                        )}
                        {originalSnapshot && editSection && (
                          <Button type="button" variant="outline" size="sm" className="h-7 text-[11px] w-full justify-center" onClick={revertOriginal} disabled={!editSection || !(isOwner || collaboratorRole === 'editor')}>
                            <RotateCcw className="h-3.5 w-3.5 mr-1" /> Revert Original
                          </Button>
                        )}
                      </div>
                      <div className="space-y-2">
                        <p className="text-xs font-medium flex items-center gap-1"><Sparkles className="h-3.5 w-3.5 text-fuchsia-500" /> Suggestions</p>
                        <div className="flex flex-wrap gap-1">
                          {instructionSuggestions.map(s => (
                            <button key={s} type="button" onClick={() => setAiInstruction(ai => ai ? ai.trimEnd() + (ai.trim().endsWith('.') ? ' ' : '. ') + s + '.' : s + '.')} className="px-2 py-1 rounded-full bg-indigo-500/10 hover:bg-indigo-500/20 text-[11px] text-indigo-600 dark:text-indigo-300 border border-indigo-500/30 transition">
                              {s}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                    {/* Right column: editing */}
                    <div className="md:col-span-2 space-y-5">
                      <div className="space-y-2">
                        <label className="text-sm font-medium flex items-center gap-2">Manual Content {editSection ? <span className="text-xs font-normal text-neutral-500 dark:text-neutral-400">{editSection.startsWith('tasks.') ? '(JSON Array of Tasks)' : '(Line-separated Items)'}</span> : null}</label>
                        <Textarea
                          rows={12}
                          value={editText}
                          onChange={e => setEditText(e.target.value)}
                          className="font-mono text-xs bg-white/70 dark:bg-neutral-800/60 resize-y min-h-[220px]"
                          disabled={!editSection || !(isOwner || collaboratorRole === 'editor')}
                          placeholder={editSection ? '' : 'Select a section first'}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium flex items-center gap-2">AI Instruction <span className="text-xs font-normal text-neutral-500 dark:text-neutral-400">(optional)</span></label>
                        <Textarea
                          rows={4}
                          placeholder={(isOwner || collaboratorRole === 'editor') ? 'e.g., Add performance optimization tasks and clarify database indexing strategy' : 'Viewer access – editing disabled'}
                          value={aiInstruction}
                          onChange={e => setAiInstruction(e.target.value)}
                          disabled={!editSection || !(isOwner || collaboratorRole === 'editor')}
                          className="bg-white/70 dark:bg-neutral-800/60"
                        />
                        <div className="flex flex-wrap gap-2">
                          <Button type="button" variant="outline" disabled={!editSection || isRefining || !(isOwner || collaboratorRole === 'editor')} onClick={refineWithAI} className="gap-1">
                            {isRefining ? <Spinner size="xs" label="Refining" /> : <Brain className="h-4 w-4" />}
                            {isRefining ? 'Refining...' : 'Refine with AI'}
                          </Button>
                          <Button type="button" variant="default" disabled={!editSection || !(isOwner || collaboratorRole === 'editor') || (editSection?.startsWith('tasks.') && parseOk === false)} onClick={applyManualEdit} className="gap-1">
                            <Wand2 className="h-4 w-4" /> Apply Manual Edit
                          </Button>
                        </div>
                        {!(isOwner || collaboratorRole === 'editor') && <p className="text-xs text-neutral-500">You have read-only access. Ask the owner for edit permissions.</p>}
                      </div>
                    </div>
                  </div>
                  <DialogFooter className="mt-4 flex items-center justify-between">
                    <p className="text-[10px] text-neutral-500 dark:text-neutral-400">Changes apply locally until you regenerate or export.</p>
                    <Button variant="ghost" onClick={() => { setEditDialogOpen(false); setEditSection(null); }}>Close</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </>
          )}
          {!projectPlan && (
            <div className="text-center py-24 opacity-60 text-sm">Select or generate a plan to view details.</div>
          )}
        </div>
      </div>
    </div>
  );
}

// Root page (/) supplies no initial props.
export default function Home() { return <HomeClientInternal />; }