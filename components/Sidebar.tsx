'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { FileText, Trash2, Calendar, Clock, ChevronLeft, ChevronRight, Plus, Users, Loader2, Search } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction
} from '@/components/ui/alert-dialog';
import InviteCollaboratorsDialog from '@/components/InviteCollaboratorsDialog';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { CommandDialog, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command';
import NewPlanButton from '@/components/NewPlanButton';
import SearchPlansButton from '@/components/SearchPlansButton';
import PlanCard from '@/components/PlanCard';
import { ProjectPlan } from '@/types/project';

interface SavedPlan {
  _id: string;
  plan: ProjectPlan;
  createdAt: string;
  updatedAt: string;
  isOwner?: boolean;
  collaboratorRole?: 'viewer' | 'editor';
  collaborators?: Array<{ userId: string; role: 'viewer' | 'editor' }>;
  collaboratorCount?: number;
  collaboratorsDetailed?: Array<{ userId: string; role: 'viewer' | 'editor'; email?: string | null; image?: string | null; name?: string | null }>;
  ownerProfile?: { email?: string; image?: string; name?: string } | null;
}

interface SidebarProps {
  onSelectPlan: (plan: ProjectPlan, id: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export default function Sidebar({
  onSelectPlan,
  isCollapsed,
  onToggleCollapse
}: SidebarProps) {
  const { data: session } = useSession();
  const [savedPlans, setSavedPlans] = useState<SavedPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmAction, setConfirmAction] = useState<{ type: 'delete' | 'leave'; planId: string } | null>(null);
  const [commandOpen, setCommandOpen] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (session?.user) {
      fetchSavedPlans();
    }
  }, [session]);
  // Global shortcut for command palette (Ctrl/Cmd + K)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandOpen(o => !o);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Listen for plan-saved events to refresh list after a new plan is created
  useEffect(() => {
    const handler = () => {
      if (session?.user) fetchSavedPlans();
    };
    window.addEventListener('plan-saved', handler);
    return () => window.removeEventListener('plan-saved', handler);
  }, [session]);

  const fetchSavedPlans = async () => {
    try {
      const response = await fetch('/api/plans');
      if (response.ok) {
        const plans = await response.json();
        setSavedPlans(plans);
      }
    } catch (error) {
      console.error('Error fetching saved plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const deletePlan = async (planId: string) => {
    try {
      const response = await fetch(`/api/plans/${planId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setSavedPlans(plans => plans.filter(plan => plan._id !== planId));
      }
    } catch (error) {
      console.error('Error deleting plan:', error);
    }
  };

  const leavePlan = async (planId: string) => {
    try {
      const userId = (session as any)?.user?.id;
      if (!userId) return;
      const response = await fetch(`/api/plans/${planId}/collaborators?userId=${encodeURIComponent(userId)}`, { method: 'DELETE' });
      if (response.ok) {
        setSavedPlans(plans => plans.filter(plan => plan._id !== planId));
      }
    } catch (e) {
      console.error('Error leaving plan', e);
    }
  };

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  });

  const MotionCard = useMemo(() => motion(Card as any), []);

  const cardVariants = {
    initial: { opacity: 0, y: 12, scale: 0.98 },
    animate: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 260, damping: 22 } },
    exit: { opacity: 0, y: -6, scale: 0.98, transition: { duration: 0.15 } }
  };

  const shimmer = 'relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent';

  if (!session?.user) return null;

  return (
    <>
      {isCollapsed && (
        <div
          onMouseEnter={onToggleCollapse}
          className="fixed left-0 top-0 h-screen w-3 z-30 cursor-ew-resize group"
          aria-hidden="true"
        >
          <div className="absolute inset-y-0 left-0 w-full bg-gradient-to-r from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      )}
      {/* Layout wrapper reserves space when expanded */}
      <div
        className={`relative flex-shrink-0 transition-[width] duration-300 ease-[cubic-bezier(.16,.84,.44,1)] ${isCollapsed ? 'w-0' : 'w-[380px]'}`}
        aria-hidden={isCollapsed ? 'true' : 'false'}
      >
        {/* Animated panel */}
        <motion.div
          initial={false}
          animate={{ x: isCollapsed ? '-100%' : 0, opacity: isCollapsed ? 0.4 : 1, scale: prefersReducedMotion ? 1 : (isCollapsed ? 0.98 : 1) }}
          transition={prefersReducedMotion ? { duration: 0.25, ease: 'easeInOut' } : { type: 'spring', stiffness: 420, damping: 42, mass: 0.9 }}
          className={`group/sidebar border-r bg-background/70 backdrop-blur-xl supports-[backdrop-filter]:bg-background/50 flex flex-col h-screen max-h-screen z-40 w-[380px] absolute inset-y-0 left-0 shadow-xl will-change-transform ${isCollapsed ? 'pointer-events-none' : 'pointer-events-auto'} `}
          style={{
            WebkitBackdropFilter: 'blur(12px)',
            backdropFilter: 'blur(12px)'
          }}
        >
          {/* Optional gradient edge accent retained */}
          <div className="pointer-events-none absolute inset-y-0 left-0 w-px bg-gradient-to-b from-transparent via-primary/40 to-transparent opacity-60" />
          <div className="p-2.5 border-b border-gray-200 dark:border-neutral-800 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-neutral-100">Saved Plans</h2>
            <Button variant="ghost" size="sm" onClick={onToggleCollapse} className="p-3">
              {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </Button>
          </div>
          <div className="p-4 border-b border-gray-200 dark:border-neutral-800 space-y-2 gap-2 flex flex-col">
            <NewPlanButton href="/" onClick={() => { try { window.dispatchEvent(new Event('new-plan')); } catch { } }} />
            <SearchPlansButton onOpen={() => setCommandOpen(true)} />
          </div>
          <div className="flex-1 h-[calc(100vh-160px)] pr-1 overflow-y-auto no-scrollbar">
            <div className="p-4 space-y-3">
              {loading && (
                <div className="space-y-3 animate-in fade-in-50">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className={`rounded-md border border-border/60 h-28 bg-muted/30 ${shimmer}`} />
                  ))}
                  <style>{`@keyframes shimmer{100%{transform:translateX(100%)}}`}</style>
                </div>
              )}
              {!loading && savedPlans.length === 0 && (
                <div className="text-center text-gray-500 py-10 border border-dashed rounded-lg border-border/60">
                  <FileText className="w-8 h-8 mx-auto mb-3 opacity-70" />
                  <p className="text-sm font-medium">No saved plans yet</p>
                  <p className="text-xs text-gray-400 mt-1">Create your first project plan to get started</p>
                </div>
              )}
              <AnimatePresence mode="popLayout">
                {!loading && savedPlans.map((savedPlan, idx) => (
                  <PlanCard
                    key={savedPlan._id}
                    data={savedPlan as any}
                    index={idx}
                    onSelect={onSelectPlan}
                    onDelete={(id) => setConfirmAction({ type: 'delete', planId: id })}
                    onLeave={(id) => setConfirmAction({ type: 'leave', planId: id })}
                    sessionUserId={(session as any)?.user?.id}
                    formatDate={formatDate}
                    onRefresh={fetchSavedPlans}
                  />
                ))}
              </AnimatePresence>
            </div>
          </div>
          <style jsx global>{`
          .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
          .no-scrollbar::-webkit-scrollbar { display: none; }
        `}</style>
        </motion.div>
      </div>
      {/* Command Palette for searching plans */}
      <CommandDialog open={commandOpen} onOpenChange={setCommandOpen}>
        <CommandInput placeholder="Search plans by title or type..." autoFocus />
        <CommandList>
          <CommandEmpty>No plans found.</CommandEmpty>
          <CommandGroup heading="Plans">
            {savedPlans.map(p => (
              <CommandItem
                key={p._id}
                value={`${p.plan.overview.title} ${p.plan.overview.projectType}`}
                onSelect={() => { onSelectPlan(p.plan, p._id); setCommandOpen(false); }}
              >
                <FileText className="w-4 h-4 mr-2 opacity-70" />
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-medium truncate">{p.plan.overview.title}</span>
                  <span className="text-[10px] text-muted-foreground truncate">{p.plan.overview.projectType}</span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
      <AlertDialog open={!!confirmAction} onOpenChange={(o) => { if (!o) setConfirmAction(null); }}>
        {confirmAction && (
          <AlertDialogContent className="max-w-sm">
            <AlertDialogHeader>
              <AlertDialogTitle>
                {confirmAction.type === 'delete' ? 'Delete this plan?' : 'Leave this plan?'}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {confirmAction.type === 'delete'
                  ? 'This action cannot be undone. The plan and collaborator access will be permanently removed.'
                  : 'You will lose access unless re-invited by the owner. Your previous contributions remain.'}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setConfirmAction(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-red-600 hover:bg-red-700 focus:ring-red-600 text-white dark:text-white dark:bg-red-600 dark:hover:bg-red-500"
                onClick={() => {
                  if (!confirmAction) return;
                  if (confirmAction.type === 'delete') deletePlan(confirmAction.planId);
                  else leavePlan(confirmAction.planId);
                  setConfirmAction(null);
                }}
              >
                {confirmAction.type === 'delete' ? 'Delete' : 'Confirm Leave'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        )}
      </AlertDialog>
    </>
  );
}