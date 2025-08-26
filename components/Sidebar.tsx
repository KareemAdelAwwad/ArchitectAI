'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { FileText, Trash2, Calendar, Clock, ChevronLeft, ChevronRight, Plus, Users } from 'lucide-react';
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
  onNewProject: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export default function Sidebar({
  onSelectPlan,
  onNewProject,
  isCollapsed,
  onToggleCollapse
}: SidebarProps) {
  const { data: session } = useSession();
  const [savedPlans, setSavedPlans] = useState<SavedPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmAction, setConfirmAction] = useState<{ type: 'delete' | 'leave'; planId: string } | null>(null);

  useEffect(() => {
    if (session?.user) {
      fetchSavedPlans();
    }
  }, [session]);

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
      <div className={`border-r bg-background/60 backdrop-blur supports-[backdrop-filter]:bg-background/40 transition-transform duration-400 ease-[cubic-bezier(.16,.84,.44,1)] flex flex-col z-40 w-[380px] ${isCollapsed ? '-translate-x-full pointer-events-none fixed inset-y-0 left-0' : 'translate-x-0 shadow-lg'} `}>
        <div className="p-4 border-b border-gray-200 dark:border-neutral-800 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-neutral-100">Saved Plans</h2>
          <Button variant="ghost" size="sm" onClick={onToggleCollapse} className="p-2">
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </Button>
        </div>
        <div className="p-4 border-b border-gray-200 dark:border-neutral-800">
          <Button onClick={onNewProject} className="w-full gap-2" variant="outline">
            <Plus className="w-4 h-4" /> New Project
          </Button>
        </div>
        <ScrollArea className="flex-1 h-[calc(100vh-160px)] pr-1">
          <div className="p-4 space-y-3">
            {loading ? (
              <div className="text-center text-gray-500 py-8">
                <Clock className="w-8 h-8 mx-auto mb-2 animate-spin" />
                Loading plans...
              </div>
            ) : savedPlans.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <FileText className="w-8 h-8 mx-auto mb-2" />
                <p className="text-sm">No saved plans yet</p>
                <p className="text-xs text-gray-400 mt-1">Create your first project plan to get started</p>
              </div>
            ) : (
              savedPlans.map((savedPlan) => (
                <Card
                  key={savedPlan._id}
                  className="cursor-pointer hover:shadow-sm transition-all group border-neutral-200 dark:border-neutral-800"
                  onClick={() => onSelectPlan(savedPlan.plan, savedPlan._id)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-sm font-medium truncate flex items-center gap-2">
                          <span className="truncate">{savedPlan.plan.overview.title}</span>
                          {typeof savedPlan.collaboratorCount === 'number' && savedPlan.collaboratorCount > 0 && (
                            <Badge variant="secondary" className="text-[10px] font-normal px-1 py-0">
                              {savedPlan.collaboratorCount}
                            </Badge>
                          )}
                        </CardTitle>
                        <CardDescription className="text-xs mt-1">
                          <div className="flex items-center gap-1 mb-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(savedPlan.createdAt)}
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {savedPlan.plan.overview.projectType}
                          </Badge>
                          {savedPlan.isOwner ? (
                            <Badge variant="secondary" className="text-xs ml-1">Owner</Badge>
                          ) : savedPlan.collaboratorRole ? (
                            <Badge variant="secondary" className="text-xs ml-1">{savedPlan.collaboratorRole}</Badge>
                          ) : null}
                        </CardDescription>
                      </div>
                      {savedPlan.isOwner ? (
                        <div className="flex gap-1">
                          <InviteCollaboratorsDialog
                            planId={savedPlan._id}
                            ownerId={savedPlan.isOwner ? (session as any)?.user?.id : ''}
                            isOwner={!!savedPlan.isOwner}
                            onChanged={fetchSavedPlans}
                            trigger={
                              <Button
                                variant="ghost"
                                size="sm"
                                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 h-auto"
                                title="Manage collaborators"
                                onClick={(e) => { e.stopPropagation(); }}
                              >
                                <Users className="w-3 h-3" />
                              </Button>
                            }
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 h-auto"
                            onClick={(e) => { e.stopPropagation(); setConfirmAction({ type: 'delete', planId: savedPlan._id }); }}
                            title="Delete plan"
                          >
                            <Trash2 className="w-3 h-3 text-red-500" />
                          </Button>
                        </div>
                      ) : savedPlan.collaboratorRole ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 h-auto"
                          onClick={(e) => { e.stopPropagation(); setConfirmAction({ type: 'leave', planId: savedPlan._id }); }}
                          title="Leave plan"
                        >
                          Leave
                        </Button>
                      ) : null}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                      {savedPlan.plan.overview.description}
                    </p>
                    <Separator className="my-2" />
                    <div className="flex flex-wrap gap-1 items-center">
                      {savedPlan.plan.overview.techStack.slice(0, 3).map((tech, index) => (
                        <Badge key={index} variant="secondary" className="text-xs px-1 py-0">
                          {tech}
                        </Badge>
                      ))}
                      {savedPlan.plan.overview.techStack.length > 3 && (
                        <Badge variant="secondary" className="text-xs px-1 py-0">
                          +{savedPlan.plan.overview.techStack.length - 3}
                        </Badge>
                      )}
                      {savedPlan.collaboratorCount && savedPlan.collaboratorCount > 0 && (
                        <div className="flex -space-x-2 ml-1">
                          {savedPlan.collaboratorsDetailed?.slice(0, 3).map(c => {
                            const seed = (c.email || c.userId || '').split('').reduce((a, ch) => a + ch.charCodeAt(0), 0);
                            const hue = seed % 360;
                            const letter = (c.name || c.email || ' ').trim()[0]?.toUpperCase() || 'U';
                            return (
                              <div key={c.userId} className="w-5 h-5 rounded-full border border-white bg-cover bg-center text-[9px] flex items-center justify-center shadow" style={c.image ? { backgroundImage: `url(${c.image})` } : { backgroundColor: `hsl(${hue}deg 70% 60%)` }}>
                                {!c.image && letter}
                              </div>
                            );
                          })}
                          {savedPlan.collaboratorCount > 3 && (
                            <div className="w-5 h-5 rounded-full bg-gray-200 border border-white text-[9px] flex items-center justify-center">+{savedPlan.collaboratorCount - 3}</div>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </ScrollArea>
      </div>
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