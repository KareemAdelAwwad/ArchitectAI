'use client';

import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calendar, Trash2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import InviteCollaboratorsDialog from '@/components/InviteCollaboratorsDialog';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ProjectPlan } from '@/types/project';
import React from 'react';

export interface PlanCardData {
  _id: string;
  plan: ProjectPlan;
  createdAt: string;
  isOwner?: boolean;
  collaboratorRole?: 'viewer' | 'editor';
  collaboratorsDetailed?: Array<{ userId: string; role: 'viewer' | 'editor'; email?: string | null; image?: string | null; name?: string | null }>;
}

interface PlanCardProps {
  data: PlanCardData;
  index: number;
  onSelect: (plan: ProjectPlan, id: string) => void;
  onDelete: (id: string) => void;
  onLeave: (id: string) => void;
  sessionUserId?: string;
  formatDate: (d: string) => string;
  onRefresh: () => void;
}

const MotionCard = motion(Card as any);

export const PlanCard: React.FC<PlanCardProps> = ({ data, index, onSelect, onDelete, onLeave, sessionUserId, formatDate, onRefresh }) => {
  return (
    <MotionCard
      layout
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 260, damping: 22 } }}
      exit={{ opacity: 0, y: -6, scale: 0.98, transition: { duration: 0.15 } }}
      whileHover={{ boxShadow: '0 4px 14px -2px hsl(var(--primary)/0.20)', borderColor: 'hsl(var(--primary)/0.5)' }}
      whileTap={{ scale: 0.98 }}
      className="cursor-pointer group border border-border/70 hover:border-primary/40 transition-all relative overflow-hidden rounded-lg bg-gradient-to-br from-background to-background/95 hover:from-background/95 hover:to-primary/5 backdrop-blur supports-[backdrop-filter]:bg-background/60"
      style={{ transitionDelay: `${Math.min(index, 6) * 35}ms` }}
      onClick={() => onSelect(data.plan, data._id)}
    >
      <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <div className="absolute -inset-px rounded-lg bg-[radial-gradient(circle_at_30%_20%,hsl(var(--primary)/0.15),transparent_60%)]" />
      </div>
      <CardHeader className="pb-2 relative">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-sm font-medium truncate flex items-center gap-2">
              <span className="truncate tracking-tight">{data.plan.overview.title}</span>
            </CardTitle>
            <CardDescription className="text-[11px] mt-1 leading-relaxed">
              <div className="flex items-center gap-1 mb-1 text-muted-foreground/90">
                <Calendar className="w-3 h-3" />
                {formatDate(data.createdAt)}
              </div>
              <Badge variant="outline" className="text-[10px] font-normal">
                {data.plan.overview.projectType}
              </Badge>
              {data.isOwner ? (
                <Badge variant="secondary" className="text-[10px] ml-1">Owner</Badge>
              ) : data.collaboratorRole ? (
                <Badge variant="secondary" className="text-[10px] ml-1 capitalize">{data.collaboratorRole}</Badge>
              ) : null}
            </CardDescription>
          </div>
          {data.isOwner ? (
            <div className="flex gap-1 -mt-1">
              <InviteCollaboratorsDialog
                planId={data._id}
                ownerId={data.isOwner ? sessionUserId || '' : ''}
                isOwner={!!data.isOwner}
                onChanged={onRefresh}
                trigger={
                  <Button
                    variant="ghost"
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 transition-all p-2 h-auto hover:bg-primary/10"
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
                className="opacity-0 group-hover:opacity-100 transition-all p-2 h-auto hover:bg-red-500/10"
                onClick={(e) => { e.stopPropagation(); onDelete(data._id); }}
                title="Delete plan"
              >
                <Trash2 className="w-3 h-3 text-red-500" />
              </Button>
            </div>
          ) : data.collaboratorRole ? (
            <Button
              variant="ghost"
              size="sm"
              className="opacity-0 group-hover:opacity-100 transition-opacity p-2 h-auto"
              onClick={(e) => { e.stopPropagation(); onLeave(data._id); }}
              title="Leave plan"
            >
              Leave
            </Button>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="pt-0 relative">
        <p className="text-[11px] text-muted-foreground line-clamp-2 leading-snug">
          {data.plan.overview.description}
        </p>
        <Separator className="my-2" />
        <div className="flex flex-col">
          <div className='flex flex-wrap gap-1 items-center'>
            {data.plan.overview.techStack.slice(0, 3).map((tech, index) => (
              <Badge key={index} variant="secondary" className="text-[10px] px-2.5 py-1 font-normal">
                {tech}
              </Badge>
            ))}
            {data.plan.overview.techStack.length > 3 && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-1 font-normal">
                +{data.plan.overview.techStack.length - 3}
              </Badge>
            )}
          </div>
          <div className='mt-3'>
            {data.collaboratorsDetailed && data.collaboratorsDetailed.length > 0 && (
              <TooltipProvider delayDuration={100}>
                <div className="flex -space-x-2 ml-1">
                  {data.collaboratorsDetailed.slice(0, 4).map(c => {
                    const seed = (c.email || c.userId || '').split('').reduce((a, ch) => a + ch.charCodeAt(0), 0);
                    const hue = seed % 360;
                    const letter = (c.name || c.email || ' ').trim()[0]?.toUpperCase() || 'U';
                    const label = `${c.name || c.email || 'User'}${c.role ? ` • ${c.role}` : ''}`;
                    return (
                      <Tooltip key={c.userId}>
                        <TooltipTrigger asChild>
                          <Avatar className="w-5 h-5 border border-white/70 shadow bg-muted ring-1 ring-black/5" style={!c.image ? { backgroundColor: `hsl(${hue}deg 70% 60%)` } : undefined} onClick={(e) => e.stopPropagation()}>
                            {c.image && <AvatarImage src={c.image || ''} alt={c.name || c.email || 'Collaborator'} />}
                            <AvatarFallback className="text-[9px] font-medium">{letter}</AvatarFallback>
                          </Avatar>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-xs py-1 px-2">{label}</TooltipContent>
                      </Tooltip>
                    );
                  })}
                  {data.collaboratorsDetailed.length > 4 && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="w-5 h-5 rounded-full bg-gray-200 dark:bg-neutral-700 border border-white/70 text-[9px] flex items-center justify-center font-medium" onClick={(e) => e.stopPropagation()}>+{data.collaboratorsDetailed.length - 4}</div>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-[200px] p-2">
                        <div className="flex flex-wrap gap-1">
                          {data.collaboratorsDetailed.slice(4).map(c => (
                            <span key={c.userId} className="bg-secondary text-secondary-foreground rounded px-1 py-[1px] text-[10px]">{c.name || c.email || 'User'}</span>
                          ))}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
              </TooltipProvider>
            )}
          </div>
        </div>
      </CardContent>
    </MotionCard>
  );
};

export default PlanCard;
