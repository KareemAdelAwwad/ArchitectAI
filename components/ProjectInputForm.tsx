'use client';

import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, Plus, Wand2, Sparkles, KeyRound } from 'lucide-react';
import AISettingsDialog from '@/components/AISettingsDialog';
import { getStoredAIConfig, hasValidAIKey } from '@/lib/clientAIConfig';
import { Spinner } from '@/components/ui/spinner';
import { ProjectInput } from '@/types/project';

interface ProjectInputFormProps { onSubmit: (projectInput: ProjectInput) => void; }

const commonTechStacks = {
  Frontend: ['React', 'Vue.js', 'Angular', 'Next.js', 'TypeScript', 'Tailwind CSS', 'ShadCN', 'Material-UI', 'Bootstrap'],
  Backend: ['Node.js', 'Python', 'Java', 'C#', 'Go', 'Ruby', 'PHP', 'Express.js', 'Django', 'Spring Boot', 'Nest.js', 'Elysia.js'],
  'Full Stack': ['React', 'Node.js', 'Next.js', 'TypeScript', 'MongoDB', 'PostgreSQL', 'Firebase', 'Supabase'],
  Database: ['PostgreSQL', 'MongoDB', 'MySQL', 'Redis', 'Firebase', 'Supabase', 'DynamoDB'],
  Cloud: ['AWS', 'Google Cloud', 'Azure', 'Vercel', 'Netlify', 'Railway', 'Docker', 'Kubernetes'],
  Auth: ['Better Auth', 'Auth0', 'Firebase Auth', 'Supabase Auth', 'NextAuth.js', 'Clerk'],
};

export default function ProjectInputForm({ onSubmit }: ProjectInputFormProps) {
  const [formData, setFormData] = useState<Partial<ProjectInput>>({ projectType: undefined, techStack: [] });
  const [customTech, setCustomTech] = useState('');
  const [step, setStep] = useState(0); // 0 Basic, 1 Stack, 2 Details, 3 Review

  const steps = useMemo(() => ([
    { key: 'basic', title: 'Basic Info', desc: 'Foundational context for your project plan' },
    { key: 'stack', title: 'Tech Stack', desc: 'Technologies & platforms you prefer' },
    { key: 'details', title: 'Details', desc: 'Users, timeline, budget & requirements' },
    { key: 'review', title: 'Review', desc: 'Confirm everything before generation' }
  ]), []);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiConfig, setAiConfig] = useState(getStoredAIConfig());
  useEffect(() => {
    const handleUpdate = () => setAiConfig(getStoredAIConfig());
    window.addEventListener('architect_ai_config_updated', handleUpdate);
    return () => window.removeEventListener('architect_ai_config_updated', handleUpdate);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid || isSubmitting) return;
    setIsSubmitting(true);
    // Fire submit upward; parent will transition to processing view quickly.
    try {
      onSubmit(formData as ProjectInput);
    } finally {
      // We keep local submitting state briefly until unmounted by parent view change.
      // Fallback timeout clears it if parent doesn't change view (e.g., validation failure upstream).
      setTimeout(() => setIsSubmitting(false), 4000);
    }
  };

  const addTechnology = (tech: string) => {
    if (tech && !formData.techStack?.includes(tech)) {
      setFormData(prev => ({
        ...prev,
        techStack: [...(prev.techStack || []), tech]
      }));
    }
  };

  const removeTechnology = (tech: string) => {
    setFormData(prev => ({
      ...prev,
      techStack: prev.techStack?.filter(t => t !== tech) || []
    }));
  };

  const addCustomTechnology = () => {
    if (customTech.trim()) {
      addTechnology(customTech.trim());
      setCustomTech('');
    }
  };

  const isFormValid = !!(formData.title && formData.description && formData.projectType);
  const canGoNext = () => {
    if (step === 0) return !!(formData.title && formData.description && formData.projectType);
    if (step === 1) return (formData.techStack || []).length > 0 || true; // tech stack optional
    if (step === 2) return true; // optional details
    return isFormValid;
  };

  const next = () => { if (step < steps.length - 1 && canGoNext()) setStep(step + 1); };
  const back = () => { if (step > 0) setStep(step - 1); };

  const populateWithBlueprint = () => {
    setFormData({
      title: "AI-Powered Personal Finance Dashboard",
      description: "A web application that connects to users' bank accounts (via Plaid API) to automatically categorize transactions, visualize spending habits, and provide AI-driven insights for savings and investments. Key features include budget tracking, goal setting, and personalized financial advice.",
      projectType: "Full Stack",
      techStack: ['Next.js', 'TypeScript', 'Tailwind CSS', 'ShadCN', 'Node.js', 'Express.js', 'PostgreSQL', 'Prisma', 'Plaid API', 'Vercel', 'NextAuth.js'],
      targetUsers: "Millennials and Gen Z looking to get a better handle on their finances.",
      timeline: "2-3 months",
      budget: "$5K - $10K",
      specificRequirements: "Securely handle sensitive financial data, provide real-time data synchronization, and ensure the AI recommendations are relevant and actionable. The UI should be modern, intuitive, and mobile-responsive."
    });
    // Optionally, move the user to the review step to see the populated data
    setStep(steps.length - 1);
  };

  const descriptionCharCount = formData.description?.length || 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Stepper */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          {steps.map((s, i) => (
            <button
              key={s.key}
              type="button"
              onClick={() => i <= step && setStep(i)}
              className={`group relative flex-1 flex flex-col items-center transition focus:outline-none ${i === step ? 'text-indigo-600 dark:text-indigo-400' : 'text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300'}`}
            >
              <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium mb-1 border ${i === step ? 'bg-gradient-to-br from-indigo-500 to-purple-500 text-white shadow-sm border-transparent' : i < step ? 'bg-indigo-500/10 text-indigo-500 border-indigo-500/30' : 'border-neutral-300 dark:border-neutral-700'} `}>{i < step ? '✓' : i + 1}</span>
              <span className="text-[11px] tracking-wide uppercase font-medium">{s.title}</span>
            </button>
          ))}
        </div>
        <div className="h-1 rounded bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-purple-600 transition-all" style={{ width: `${(step / (steps.length - 1)) * 100}%` }} />
        </div>
      </div>

      {/* Panels */}
      {step === 0 && (
        <Card className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Tell us about your project idea</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <Label htmlFor="title">Project Title *</Label>
              <Input id="title" placeholder="e.g., E-commerce Platform, Task Management App" value={formData.title || ''} onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))} className="mt-1" />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="description">Project Description *</Label>
                <span className={`text-[10px] ${descriptionCharCount > 800 ? 'text-red-500' : 'text-neutral-500'}`}>{descriptionCharCount} chars</span>
              </div>
              <Textarea id="description" placeholder="Describe what you want to build, key features, users & constraints..." value={formData.description || ''} onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))} className="mt-1 min-h-[140px]" />
              <p className="text-[11px] text-neutral-500 mt-1">More context = better plan. Include goals, target users, differentiators.</p>
            </div>
            <div>
              <Label htmlFor="projectType">Project Type *</Label>
              <Select value={formData.projectType} onValueChange={(value) => setFormData(prev => ({ ...prev, projectType: value as any }))}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select project type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Frontend">Frontend Only</SelectItem>
                  <SelectItem value="Backend">Backend Only</SelectItem>
                  <SelectItem value="Full Stack">Full Stack Application</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 1 && (
        <Card className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <CardHeader>
            <CardTitle>Technology Stack</CardTitle>
            <CardDescription>Choose preferred technologies or leave blank for suggestions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {formData.techStack && formData.techStack.length > 0 && (
              <div>
                <Label>Selected Technologies</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.techStack.map((tech) => (
                    <Badge key={tech} variant="secondary" className="gap-1">
                      {tech}
                      <Button type="button" variant="ghost" size="sm" className="h-4 w-4 p-0 hover:bg-transparent" onClick={() => removeTechnology(tech)}>
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {formData.projectType && (
              <div className="space-y-5">
                {Object.entries(commonTechStacks).map(([category, technologies]) => (
                  <div key={category}>
                    <Label className="text-xs tracking-wide font-semibold text-neutral-500 dark:text-neutral-400 uppercase">{category}</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {technologies.map((tech) => (
                        <Button key={tech} type="button" variant={formData.techStack?.includes(tech) ? 'default' : 'outline'} size="sm" onClick={() => formData.techStack?.includes(tech) ? removeTechnology(tech) : addTechnology(tech)} className="text-xs px-3 py-1 rounded-full">
                          {tech}
                        </Button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div>
              <Label htmlFor="customTech">Add Custom Technology</Label>
              <div className="flex gap-2 mt-1">
                <Input id="customTech" placeholder="Enter technology name" value={customTech} onChange={(e) => setCustomTech(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomTechnology())} />
                <Button type="button" variant="outline" size="sm" onClick={addCustomTechnology}><Plus className="h-4 w-4" /></Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <CardHeader>
            <CardTitle>Additional Details</CardTitle>
            <CardDescription>Help us shape accurate tasks & phases</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <Label htmlFor="targetUsers">Target Users</Label>
              <Textarea id="targetUsers" placeholder="e.g., SMB owners, internal ops teams, students" value={formData.targetUsers || ''} onChange={(e) => setFormData(prev => ({ ...prev, targetUsers: e.target.value }))} className="mt-1" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="timeline">Preferred Timeline</Label>
                <Select value={formData.timeline} onValueChange={(value) => setFormData(prev => ({ ...prev, timeline: value }))}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select timeline" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1-3 days">1-3 days</SelectItem>
                    <SelectItem value="1-2 weeks">1-2 weeks</SelectItem>
                    <SelectItem value="1 month">1 month</SelectItem>
                    <SelectItem value="2-3 months">2-3 months</SelectItem>
                    <SelectItem value="3-6 months">3-6 months</SelectItem>
                    <SelectItem value="6+ months">6+ months</SelectItem>
                    <SelectItem value="1+ year">1+ year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="budget">Budget Range</Label>
                <Select value={formData.budget} onValueChange={(value) => setFormData(prev => ({ ...prev, budget: value }))}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select budget" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="$0">$0</SelectItem>
                    <SelectItem value="Under $1K">Under $1K</SelectItem>
                    <SelectItem value="$1K - $5K">$1K - $5K</SelectItem>
                    <SelectItem value="$5K - $10K">$5K - $10K</SelectItem>
                    <SelectItem value="$10K - $25K">$10K - $25K</SelectItem>
                    <SelectItem value="$25K+">$25K+</SelectItem>
                    <SelectItem value="Unlimited">Unlimited</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="specificRequirements">Specific Requirements</Label>
              <Textarea id="specificRequirements" placeholder="Key features, integration needs, compliance, performance targets..." value={formData.specificRequirements || ''} onChange={(e) => setFormData(prev => ({ ...prev, specificRequirements: e.target.value }))} className="mt-1" />
            </div>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <CardHeader>
            <CardTitle>Review & Generate</CardTitle>
            <CardDescription>Confirm details before we craft your tailored plan</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 text-sm">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Title</p>
                <p className="font-medium">{formData.title}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Type</p>
                <p>{formData.projectType}</p>
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500 mb-1">Description</p>
              <p className="whitespace-pre-line text-neutral-700 dark:text-neutral-300 text-sm leading-relaxed bg-neutral-50 dark:bg-neutral-900/40 p-3 rounded-lg border border-neutral-200 dark:border-neutral-800 max-h-48 overflow-auto">{formData.description}</p>
            </div>
            {(formData.techStack?.length || 0) > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500 mb-1">Tech Stack</p>
                <div className="flex flex-wrap gap-1">
                  {formData.techStack?.map(t => <span key={t} className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 text-xs border border-indigo-500/20">{t}</span>)}
                </div>
              </div>
            )}
            <div className="grid gap-4 md:grid-cols-2">
              {formData.targetUsers && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500 mb-1">Target Users</p>
                  <p className="text-neutral-700 dark:text-neutral-300 text-sm leading-relaxed whitespace-pre-line">{formData.targetUsers}</p>
                </div>
              )}
              {(formData.timeline || formData.budget) && (
                <div className="flex flex-col gap-3">
                  {formData.timeline && <div><p className="text-xs font-semibold uppercase tracking-wide text-neutral-500 mb-1">Timeline</p><p>{formData.timeline}</p></div>}
                  {formData.budget && <div><p className="text-xs font-semibold uppercase tracking-wide text-neutral-500 mb-1">Budget</p><p>{formData.budget}</p></div>}
                </div>
              )}
            </div>
            {formData.specificRequirements && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500 mb-1">Specific Requirements</p>
                <p className="text-neutral-700 dark:text-neutral-300 text-sm leading-relaxed whitespace-pre-line">{formData.specificRequirements}</p>
              </div>
            )}
            <div className="flex items-center justify-between p-3 rounded-lg border border-purple-500/20 bg-purple-500/5 text-xs">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
                <span className="text-neutral-600 dark:text-neutral-300">
                  AI Engine: <strong className="text-neutral-900 dark:text-white font-medium">{hasValidAIKey() ? `${aiConfig.provider?.toUpperCase()} (${aiConfig.model})` : 'Offline Heuristic (No Key Set)'}</strong>
                </span>
              </div>
              <AISettingsDialog trigger={<Button type="button" variant="ghost" size="sm" className="h-7 text-xs text-purple-600 dark:text-purple-400 hover:text-purple-700">Change</Button>} />
            </div>

            {!isFormValid && <p className="text-xs text-red-500">Title, description & project type are required.</p>}
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-2">
          <Button type="button" variant="ghost" disabled={step === 0} onClick={back}>Back</Button>
          <Button type="button" variant="outline" size="sm" onClick={populateWithBlueprint}>Quick Build Blueprint</Button>
        </div>
        {step < steps.length - 1 && (
          <Button type="button" onClick={next} disabled={!canGoNext()} className="px-6">Next</Button>
        )}
        {step === steps.length - 1 && (
          <div className="relative">
            <Button
              type="submit"
              disabled={!isFormValid || isSubmitting}
              className="group relative overflow-hidden px-8 bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-md shadow-indigo-500/20 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {/* Animated sheen */}
              <span className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <span className="absolute -inset-0.5 bg-[radial-gradient(circle_at_10%_0%,rgba(255,255,255,0.4),transparent_60%)] mix-blend-overlay animate-pulse" />
              </span>
              <span className="flex items-center gap-2 font-medium">
                {isSubmitting ? (
                  <>
                    <Spinner size="xs" variant="secondary" label="Generating" />
                    <span>Generating…</span>
                  </>
                ) : (
                  <div className="flex items-center gap-2 text-white">
                    <Wand2 className="h-4 w-4" />
                    <span>Generate Plan</span>
                  </div>
                )}
              </span>
            </Button>
            {!isFormValid && !isSubmitting && (
              <p className="absolute w-max max-w-xs right-0 translate-y-full mt-1 text-[10px] text-red-500">Fill required fields to enable</p>
            )}
            <span aria-live="polite" className="sr-only">{isSubmitting ? 'Generating plan…' : ''}</span>
          </div>
        )}
      </div>
    </form>
  );
}