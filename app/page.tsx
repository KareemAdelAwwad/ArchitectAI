"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
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

  useEffect(() => {
    if (initialPlanId) {
      setIsOwner(initialIsOwner);
      setCollaboratorRole(initialCollaboratorRole);
    }
  }, [initialPlanId, initialIsOwner, initialCollaboratorRole]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
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

  const handleProjectSubmit = async (projectInput: ProjectInput) => {
    setCurrentStep('processing');
    setProcessingProgress(0);

    // Simulate processing steps
    const steps = [
      'Analyzing project scope...',
      'Defining stakeholders and objectives...',
      'Gathering functional requirements...',
      'Creating system architecture...',
      'Generating development tasks...',
      'Finalizing project plan...'
    ];

    for (let i = 0; i < steps.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 800));
      setProcessingProgress((i + 1) * (100 / steps.length));
    }

    // Request AI-generated plan
    let plan: ProjectPlan | null = null;
    try {
      const res = await fetch('/api/generate-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: projectInput })
      });
      if (!res.ok) {
        throw new Error('AI generation failed');
      }
      plan = await res.json();
    } catch (e) {
      console.error('AI generation error, falling back to local planner', e);
      const mod = await import('@/lib/projectPlanner');
      plan = mod.generateProjectPlan(projectInput);
    }
    if (!plan) return;
    setProjectPlan(plan);

    // Save plan to database if user is authenticated
    if (session?.user) {
      try {
        const res = await fetch('/api/plans', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include', // explicit to ensure cookies (session) sent
          body: JSON.stringify({ plan }),
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

    setCurrentStep('results');
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-end mb-8">
            <AuthButton />
          </div>
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-6">
              <Target className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              AI Project Planning Assistant
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              Transform your ideas into actionable development plans using proven Waterfall methodology.
              Sign in to save your plans and access them anytime.
            </p>
            <AuthButton />
          </div>
        </div>
      </div>
    );
  }
  if (currentStep === 'input') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex">
        <Sidebar
          onSelectPlan={handleSelectPlan}
          onNewProject={handleNewProject}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
        <div className="flex-1 container mx-auto px-4 py-8">
          <div className="flex justify-end mb-8">
            <AuthButton />
          </div>
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-6">
              <Target className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              AI Project Planning Assistant
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Transform your ideas into actionable development plans using proven Waterfall methodology.
              Get comprehensive task breakdowns, timeline estimates, and technical recommendations.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <Clock className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                <CardTitle className="text-lg">Planning Phase</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Define scope, objectives, and project timeline</p>
              </CardContent>
            </Card>
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <Users className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <CardTitle className="text-lg">Analysis Phase</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Gather requirements and create user stories</p>
              </CardContent>
            </Card>
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <Code className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                <CardTitle className="text-lg">Design Phase</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Create architecture and technical specifications</p>
              </CardContent>
            </Card>
          </div>

          <Card className="max-w-4xl mx-auto">
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
    );
  }

  if (currentStep === 'processing') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex">
        <Sidebar
          onSelectPlan={handleSelectPlan}
          onNewProject={handleNewProject}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
        <div className="flex-1 flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-4 mx-auto">
                <Zap className="w-8 h-8 text-white animate-pulse" />
              </div>
              <CardTitle>Processing Your Project</CardTitle>
              <CardDescription>Analyzing requirements and generating your comprehensive plan</CardDescription>
            </CardHeader>
            <CardContent>
              <Progress value={processingProgress} className="w-full mb-4" />
              <p className="text-center text-sm text-gray-600">
                {processingProgress < 100 ? 'Please wait...' : 'Almost done!'}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex">
      <Sidebar
        onSelectPlan={handleSelectPlan}
        onNewProject={handleNewProject}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <div className="flex-1 container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Project Plan Generated</h1>
            <p className="text-gray-600">Your comprehensive development roadmap is ready</p>
          </div>
          <div className="space-x-3">
            <AuthButton />
            {projectPlan && currentPlanId && (
              <ExportPlanButton planId={currentPlanId} />
            )}
            <Button onClick={handleStartOver} variant="default">
              Start Over
            </Button>
            {projectPlan && (isOwner || collaboratorRole === 'editor') && (
              <>
                <Button type="button" variant="secondary" onClick={() => { setEditDialogOpen(true); }}>
                  Edit / Refine Section
                </Button>
                <Dialog open={editDialogOpen} onOpenChange={(o) => { setEditDialogOpen(o); if (!o) { setEditSection(null); setAiInstruction(''); } }}>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>{editSection ? `Editing: ${sectionLabels[editSection] || editSection}` : 'Select Section to Edit'}</DialogTitle>
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
                          disabled={!editSection}
                          placeholder={editSection ? '' : 'Select a section first'}
                        />
                      </div>
                      <Separator />
                      <div className="space-y-2">
                        <label className="text-sm font-medium">AI Refinement Instruction (optional)</label>
                        <Textarea
                          rows={3}
                          placeholder="e.g., Add performance optimization tasks and clarify database indexing strategy"
                          value={aiInstruction}
                          onChange={e => setAiInstruction(e.target.value)}
                          disabled={!editSection}
                        />
                        <div className="flex gap-2">
                          <Button type="button" variant="outline" disabled={!editSection || isRefining} onClick={refineWithAI}>{isRefining ? 'Refining...' : 'Refine with AI'}</Button>
                          <Button type="button" variant="default" disabled={!editSection} onClick={applyManualEdit}>Apply Manual Edit</Button>
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="ghost" onClick={() => { setEditDialogOpen(false); setEditSection(null); }}>Close</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </>
            )}
          </div>
        </div>

        {projectPlan && (
          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  {projectPlan.overview.title}
                </CardTitle>
                <CardDescription>{projectPlan.overview.description}</CardDescription>
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
                    <p className="text-sm text-gray-600">{projectPlan.overview.timeline}</p>
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
                <TaskList key={currentPlanId || projectPlan.overview.title} tasks={projectPlan.tasks} onToggleTask={handleTaskToggle} readOnly={!isOwner && collaboratorRole !== 'editor'} />
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
  );
}

// Root page (/) supplies no initial props; dynamic plan route uses HomeClient directly.
export default function Home() { return <HomeClientInternal />; }