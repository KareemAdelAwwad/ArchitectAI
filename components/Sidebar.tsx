'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { FileText, Trash2, Calendar, Clock, ChevronLeft, ChevronRight, Plus, Users } from 'lucide-react';
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
      // current user id from session
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

  // Invite handled by dialog component now

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (!session?.user) {
    return null;
  }

  return (
    <div className={`bg-white border-r border-gray-200 transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-80'
      }`}>
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <h2 className="text-lg font-semibold text-gray-900">Saved Plans</h2>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleCollapse}
            className="p-2"
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </Button>
        </div>

        {!isCollapsed && (
          <Button
            onClick={onNewProject}
            className="w-full mt-3 gap-2"
            variant="outline"
          >
            <Plus className="w-4 h-4" />
            New Project
          </Button>
        )}
      </div>

      {!isCollapsed && (
        <ScrollArea className="flex-1 h-[calc(100vh-120px)]">
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
                <p className="text-xs text-gray-400 mt-1">
                  Create your first project plan to get started
                </p>
              </div>
            ) : (
              savedPlans.map((savedPlan) => (
                <Card
                  key={savedPlan._id}
                  className="cursor-pointer hover:shadow-md transition-shadow group"
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
                            onClick={(e) => {
                              e.stopPropagation();
                              deletePlan(savedPlan._id);
                            }}
                          >
                            <Trash2 className="w-3 h-3 text-red-500" />
                          </Button>
                        </div>
                      ) : savedPlan.collaboratorRole ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 h-auto"
                          onClick={(e) => { e.stopPropagation(); leavePlan(savedPlan._id); }}
                        >
                          Leave
                        </Button>
                      ) : null}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-xs text-gray-600 line-clamp-2">
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
      )}
    </div>
  );
}