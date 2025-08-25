'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  FileText, 
  Trash2, 
  Calendar, 
  Clock,
  ChevronLeft,
  ChevronRight,
  Plus
} from 'lucide-react';
import { ProjectPlan } from '@/types/project';

interface SavedPlan {
  _id: string;
  plan: ProjectPlan;
  createdAt: string;
  updatedAt: string;
}

interface SidebarProps {
  onSelectPlan: (plan: ProjectPlan) => void;
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
    <div className={`bg-white border-r border-gray-200 transition-all duration-300 ${
      isCollapsed ? 'w-16' : 'w-80'
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
                  onClick={() => onSelectPlan(savedPlan.plan)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-sm font-medium truncate">
                          {savedPlan.plan.overview.title}
                        </CardTitle>
                        <CardDescription className="text-xs mt-1">
                          <div className="flex items-center gap-1 mb-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(savedPlan.createdAt)}
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {savedPlan.plan.overview.projectType}
                          </Badge>
                        </CardDescription>
                      </div>
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
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-xs text-gray-600 line-clamp-2">
                      {savedPlan.plan.overview.description}
                    </p>
                    <Separator className="my-2" />
                    <div className="flex flex-wrap gap-1">
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