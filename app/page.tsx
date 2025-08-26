"use client";

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { ShinyButton } from '@/components/ui/shiny-button';
import { Hero, FeatureGrid, CTA } from '@/components/landing/Hero';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, Clock, Users, Target, AlertTriangle, Database, Code, Smartphone, Server, Zap, Download } from 'lucide-react';
import AuthButton from '@/components/AuthButton';
import Sidebar from '@/components/Sidebar';
import ProjectInputForm from '@/components/ProjectInputForm';
import TaskList from '@/components/TaskList';
import PhaseResults from '@/components/PhaseResults';
import ExportPlanButton from '@/components/ExportPlanButton';
import { TopNav } from '@/components/TopNav';
// import { generateProjectPlan } from '@/lib/projectPlanner';
import { ProjectInput, ProjectPlan } from '@/types/project';

// NOTE: Moved HomeClient to components/HomeClient.tsx for type isolation.
// Keeping implementation here to avoid large refactor; removing named export to satisfy Next type checker.
interface HomeProps {
  initialPlan?: ProjectPlan;
  initialPlanId?: string;
  initialIsOwner?: boolean;
  initialCollaboratorRole?: 'viewer' | 'editor' | null;
}
function HomeClientInternal({ initialPlan, initialPlanId, initialIsOwner = false, initialCollaboratorRole = null }: HomeProps) {
  const { data: session, status } = useSession();
  const [currentStep, setCurrentStep] = useState<'input' | 'processing' | 'results'>(initialPlan ? 'results' : 'input');
  const [projectPlan, setProjectPlan] = useState<ProjectPlan | null>(initialPlan ?? null);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [currentPlanId, setCurrentPlanId] = useState<string | null>(initialPlanId ?? null);
  const [isOwner, setIsOwner] = useState<boolean>(false);
  const [collaboratorRole, setCollaboratorRole] = useState<'viewer' | 'editor' | null>(initialCollaboratorRole);
  const [collaborators, setCollaborators] = useState<Array<{ userId: string; role: 'viewer' | 'editor'; name?: string | null; image?: string | null }>>([]);

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
      if (saved) setSidebarCollapsed(saved === 'true');
    } catch { }
  }, []);
  useEffect(() => {
    try { localStorage.setItem('sidebarCollapsed', String(sidebarCollapsed)); } catch { }
  }, [sidebarCollapsed]);
  const [editSection, setEditSection] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [aiInstruction, setAiInstruction] = useState('');
  const [isRefining, setIsRefining] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

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
    } else if (Array.isArray(value)) {
      setEditText(value.join('\n'));
    } else {
      setEditText(typeof value === 'string' ? value : JSON.stringify(value, null, 2));
    }
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

  const refineWithAI = async () => {
    if (!projectPlan || !editSection) return;
    setIsRefining(true);
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

  const handleNewProject = () => {
    setCurrentStep('input');
    setProjectPlan(null);
    setProcessingProgress(0);
  };

  // Show sign-in prompt if not authenticated
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center" data-page>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex flex-col" data-page>
        <TopNav />
        {/* Marketing / public landing experience */}
        <main className="flex-1">
          <Hero />
          <FeatureGrid />
          <CTA />
        </main>
        <footer className="border-t py-8 text-center text-xs text-neutral-500">© {new Date().getFullYear()} ArchitectAI. Built for pragmatic engineering teams.</footer>
      </div>
    );
  }
  if (currentStep === 'input') {
    return (
      <div className="min-h-screen flex" data-page>
        <Sidebar
          onSelectPlan={handleSelectPlan}
          onNewProject={handleNewProject}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
        <div className="flex-1 flex flex-col">
          <TopNav />
          <div className="mx-auto w-full max-w-6xl px-4 py-10">
            <div className="text-center mb-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl mb-6 bg-gradient-to-tr from-blue-600 to-purple-600 shadow-lg ring-1 ring-black/5">
                <Target className="w-8 h-8 text-white drop-shadow" />
              </div>
              <h1 className="text-4xl font-bold tracking-tight mb-4">Plan Faster. Ship Smarter.</h1>
              <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">Comprehensive task breakdowns, phase deliverables, estimates, and refinement tools — all generated and iterated with AI.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-12">
              <Card className="text-center hover:shadow-md transition-all border-neutral-200 dark:border-neutral-800">
                <CardHeader>
                  <Clock className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                  <CardTitle className="text-lg">Planning Phase</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">Define scope, objectives, and project timeline</p>
                </CardContent>
              </Card>
              <Card className="text-center hover:shadow-md transition-all border-neutral-200 dark:border-neutral-800">
                <CardHeader>
                  <Users className="w-8 h-8 text-green-500 mx-auto mb-2" />
                  <CardTitle className="text-lg">Analysis Phase</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">Gather requirements and create user stories</p>
                </CardContent>
              </Card>
              <Card className="text-center hover:shadow-md transition-all border-neutral-200 dark:border-neutral-800">
                <CardHeader>
                  <Code className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                  <CardTitle className="text-lg">Design Phase</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">Create architecture and technical specifications</p>
                </CardContent>
              </Card>
            </div>

            <Card className="max-w-4xl mx-auto border-neutral-200 dark:border-neutral-800">
              <CardHeader>
                <CardTitle>Start Your Project Planning</CardTitle>
                <CardDescription>
                  Provide details about your project and let our AI guide you through comprehensive planning
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ProjectInputForm onSubmit={handleProjectSubmit} />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (currentStep === 'processing') {
    const currentStepIndex = Math.min(generationSteps.length - 1, Math.floor((processingProgress / 100) * generationSteps.length));
    return (
      <div className="min-h-screen flex" data-page>
        <Sidebar
          onSelectPlan={handleSelectPlan}
          onNewProject={handleNewProject}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
        <div className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-2xl relative">
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-transparent blur-xl" aria-hidden="true"></div>
            <div className="relative rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/60 backdrop-blur supports-[backdrop-filter]:bg-white/50 dark:supports-[backdrop-filter]:bg-neutral-900/40 shadow-xl p-10">
              <div className="flex flex-col items-center text-center mb-8">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center shadow-lg ring-1 ring-black/5 mb-6 animate-pulse">
                  <Zap className="w-10 h-10 text-white" />
                </div>
                <h1 className="text-2xl font-semibold tracking-tight mb-2">Generating Your Project Plan</h1>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 max-w-md">This usually takes between <span className="font-medium text-neutral-800 dark:text-neutral-200">2–4 minutes</span> depending on project complexity. Feel free to grab a coffee.</p>
              </div>
              <div className="mb-8">
                <div className="h-3 rounded-full bg-neutral-200/70 dark:bg-neutral-800/70 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 transition-all duration-500 ease-out" style={{ width: `${processingProgress}%` }} />
                </div>
                <div className="flex justify-between text-xs mt-2 text-neutral-600 dark:text-neutral-400">
                  <span>{processingProgress < 100 ? `${processingProgress.toFixed(0)}%` : '100%'}</span>
                  <span>{processingProgress < 100 ? estimatedRemaining : 'Finalizing...'}</span>
                </div>
              </div>
              <ul className="space-y-3 mb-8">
                {generationSteps.map((s, i) => {
                  const done = i < currentStepIndex;
                  const active = i === currentStepIndex && processingProgress < 100;
                  return (
                    <li key={s} className={`flex items-center gap-3 text-sm rounded-md px-3 py-2 border transition-colors ${done ? 'border-green-500/30 bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-300' : active ? 'border-blue-500/40 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 animate-pulse' : 'border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400'} `}>
                      <span className="w-5 text-center">
                        {done ? '✓' : active ? '•' : ''}
                      </span>
                      <span className="flex-1 truncate">{s}</span>
                    </li>
                  );
                })}
              </ul>
              <p className="text-xs text-neutral-500 dark:text-neutral-500 text-center">Optimizing tasks, phases & estimates with AI models…</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex" data-page>
      <Sidebar
        onSelectPlan={handleSelectPlan}
        onNewProject={handleNewProject}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <div className={`flex flex-col w-full transition-all duration-300 ease-out ${sidebarCollapsed ? 'pl-0' : ''}`}>
        <TopNav right={projectPlan && currentPlanId ? <ExportPlanButton planId={currentPlanId} /> : undefined} />
        <div className={`px-6 py-10 transition-all duration-300 w-full max-w-[90rem] mx-auto ${sidebarCollapsed ? '' : ''}`}>
          <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">Project Plan Generated</h1>
              <p className="text-neutral-600 dark:text-neutral-400">Your comprehensive development roadmap is ready</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {projectPlan && (() => {
                const canEdit = isOwner || collaboratorRole === 'editor'; return (
                  <>
                    <Button type="button" variant="secondary" onClick={() => { setEditDialogOpen(true); }} title={canEdit ? 'Refine or manually edit a section' : 'View sections (read-only)'}>
                      Edit / Refine
                    </Button>
                    <Dialog open={editDialogOpen} onOpenChange={(o) => { setEditDialogOpen(o); if (!o) { setEditSection(null); setAiInstruction(''); } }}>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">{editSection ? `Editing: ${sectionLabels[editSection] || editSection}` : 'Select Section to Edit'} {!canEdit && <Badge variant="outline" className="text-[10px]">Read-only</Badge>}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <label className="text-sm font-medium">Choose Section</label>
                            <select
                              className="mt-1 w-full border rounded px-2 py-1 text-sm"
                              value={editSection || ''}
                              onChange={(e) => openManualEdit(e.target.value)}
                            >
                              <option value="" disabled>Select a section...</option>
                              {editableSections.map(s => <option key={s} value={s}>{sectionLabels[s] || s}</option>)}
                            </select>
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Manual Content {editSection ? `(${editSection.startsWith('tasks.') ? 'JSON Array of Tasks' : 'Line-separated Items'})` : ''}</label>
                            <Textarea
                              rows={10}
                              value={editText}
                              onChange={e => setEditText(e.target.value)}
                              className="font-mono text-xs"
                              disabled={!editSection || !canEdit}
                              placeholder={editSection ? '' : 'Select a section first'}
                            />
                          </div>
                          <Separator />
                          <div className="space-y-2">
                            <label className="text-sm font-medium">AI Refinement Instruction (optional)</label>
                            <Textarea
                              rows={3}
                              placeholder={canEdit ? 'e.g., Add performance optimization tasks and clarify database indexing strategy' : 'Editing disabled (viewer access)'}
                              value={aiInstruction}
                              onChange={e => setAiInstruction(e.target.value)}
                              disabled={!editSection || !canEdit}
                            />
                            <div className="flex gap-2">
                              <Button type="button" variant="outline" disabled={!editSection || isRefining || !canEdit} onClick={refineWithAI}>{isRefining ? 'Refining...' : 'Refine with AI'}</Button>
                              <Button type="button" variant="default" disabled={!editSection || !canEdit} onClick={applyManualEdit}>Apply Manual Edit</Button>
                            </div>
                            {!canEdit && <p className="text-xs text-neutral-500">You have read-only access to this plan. Ask the owner for edit permissions.</p>}
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="ghost" onClick={() => { setEditDialogOpen(false); setEditSection(null); }}>Close</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </>
                );
              })()}
            </div>
          </div>

          {projectPlan && (
            <div className="space-y-10">
              <Card className="border-neutral-200 dark:border-neutral-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    {projectPlan.overview.title}
                  </CardTitle>
                  <CardDescription className="dark:text-neutral-400">{projectPlan.overview.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-6">
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Code className="w-4 h-4" />
                        Project Type
                      </h4>
                      <Badge variant="secondary">{projectPlan.overview.projectType}</Badge>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Database className="w-4 h-4" />
                        Tech Stack
                      </h4>
                      <div className="flex flex-wrap gap-1">
                        {projectPlan.overview.techStack.map((tech, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {tech}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Timeline
                      </h4>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">{projectPlan.overview.timeline}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Tabs defaultValue="tasks" className="space-y-6">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="tasks">Development Tasks</TabsTrigger>
                  <TabsTrigger value="phases">Waterfall Phases</TabsTrigger>
                </TabsList>

                <TabsContent value="tasks">
                  <TaskList key={(currentPlanId || projectPlan.overview.title) + ':tasks'} tasks={projectPlan.tasks} onToggleTask={handleTaskToggle} readOnly={!isOwner && collaboratorRole !== 'editor'} />
                </TabsContent>

                <TabsContent value="phases">
                  <PhaseResults
                    planning={projectPlan.waterfallPhases.planning}
                    analysis={projectPlan.waterfallPhases.analysis}
                    design={projectPlan.waterfallPhases.design}
                  />
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Root page (/) supplies no initial props; dynamic plan route uses HomeClient directly.
export default function Home() { return <HomeClientInternal />; }