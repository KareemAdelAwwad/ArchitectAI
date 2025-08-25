"use client";
import React, { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';

interface CollaboratorEntry {
  userId: string;
  role: 'viewer' | 'editor';
  email?: string | null;
  name?: string | null;
}

interface Props {
  planId: string;
  ownerId: string;
  isOwner: boolean;
  trigger?: React.ReactNode;
  onChanged?: () => void;
}

export const InviteCollaboratorsDialog: React.FC<Props> = ({ planId, isOwner, trigger, onChanged }) => {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'viewer' | 'editor'>('viewer');
  const [collabs, setCollabs] = useState<CollaboratorEntry[]>([]);
  const [owner, setOwner] = useState<CollaboratorEntry | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [linkRole, setLinkRole] = useState<'viewer' | 'editor'>('viewer');

  const load = async () => {
    try {
      const res = await fetch(`/api/plans/${planId}/collaborators`);
      if (res.ok) {
        const data = await res.json();
        setOwner({ userId: data.owner.userId, role: 'editor', email: data.owner.email, name: data.owner.name });
        setCollabs(data.collaborators || []);
      }
    } catch { /* ignore */ }
  };
  useEffect(() => { if (open) load(); }, [open]);

  const invite = async () => {
    if (!email.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/plans/${planId}/collaborators`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: email.trim(), role }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Invite failed');
      toast({ title: 'Collaborator added', description: `${data.collaborator.email || 'User'} added as ${role}` });
      setEmail('');
      setRole('viewer');
      setCollabs(c => [...c, data.collaborator]);
      onChanged?.();
    } catch (e: any) {
      toast({ title: 'Invite failed', description: e.message, variant: 'destructive' as any });
    } finally {
      setLoading(false);
    }
  };

  const generateLink = async () => {
    try {
      const res = await fetch(`/api/plans/${planId}/invite-link`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role: linkRole }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setInviteLink(data.url || null);
      toast({ title: 'Invite link created', description: 'Copy and share with others.' });
    } catch (e: any) {
      toast({ title: 'Link failed', description: e.message, variant: 'destructive' as any });
    }
  };

  const copyLink = async () => {
    if (!inviteLink) return;
    try { await navigator.clipboard.writeText(inviteLink); toast({ title: 'Copied', description: 'Invite link copied to clipboard.' }); } catch { }
  };

  const updateRole = async (userId: string, newRole: 'viewer' | 'editor') => {
    try {
      const res = await fetch(`/api/plans/${planId}/collaborators`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, role: newRole }) });
      if (!res.ok) throw new Error('Failed');
      setCollabs(c => c.map(col => col.userId === userId ? { ...col, role: newRole } : col));
      toast({ title: 'Role updated', description: `Role changed to ${newRole}` });
      onChanged?.();
    } catch {
      toast({ title: 'Update failed', description: 'Unable to change role', variant: 'destructive' as any });
    }
  };

  const remove = async (userId: string) => {
    if (!confirm('Remove collaborator?')) return;
    try {
      const res = await fetch(`/api/plans/${planId}/collaborators?userId=${encodeURIComponent(userId)}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed');
      setCollabs(c => c.filter(col => col.userId !== userId));
      toast({ title: 'Removed', description: 'Collaborator removed' });
      onChanged?.();
    } catch {
      toast({ title: 'Remove failed', description: 'Unable to remove collaborator', variant: 'destructive' as any });
    }
  };

  const existingEmails = useMemo(() => new Set(collabs.map(c => c.email?.toLowerCase() || '')), [collabs]);
  const emailExists = email && existingEmails.has(email.toLowerCase());

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger || <Button size="sm" variant="outline">Share</Button>}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Collaborators</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Invite by email</label>
            <div className="flex gap-2 mt-1">
              <Input placeholder="user@example.com" value={email} onChange={e => setEmail(e.target.value)} disabled={!isOwner || loading} />
              <select className="border rounded px-2 text-sm" value={role} disabled={!isOwner || loading} onChange={e => setRole(e.target.value as any)}>
                <option value="viewer">Viewer</option>
                <option value="editor">Editor</option>
              </select>
              <Button size="sm" onClick={invite} disabled={Boolean(!isOwner || loading || !email || emailExists)}>Invite</Button>
            </div>
            {emailExists && <p className="text-xs text-red-500 mt-1">Email already a collaborator.</p>}
          </div>
          <ScrollArea className="max-h-64 pr-2">
            <div className="space-y-2">
              {owner && (
                <div className="flex items-center justify-between rounded border p-2 bg-muted/50">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{owner.name || owner.email || 'Owner'}</p>
                    <p className="text-xs text-muted-foreground truncate">{owner.email}</p>
                  </div>
                  <Badge variant="secondary">Owner</Badge>
                </div>
              )}
              {collabs.map(c => (
                <div key={c.userId} className="flex items-center justify-between rounded border p-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{c.name || c.email || c.userId}</p>
                    <p className="text-xs text-muted-foreground truncate">{c.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {isOwner && (
                      <select
                        className="border rounded px-2 py-1 text-xs"
                        value={c.role}
                        onChange={e => updateRole(c.userId, e.target.value as any)}
                      >
                        <option value="viewer">Viewer</option>
                        <option value="editor">Editor</option>
                      </select>
                    )}
                    {isOwner && <Button size="sm" variant="ghost" onClick={() => remove(c.userId)}>Remove</Button>}
                  </div>
                </div>
              ))}
              {collabs.length === 0 && <p className="text-xs text-muted-foreground">No collaborators yet.</p>}
            </div>
          </ScrollArea>
          {isOwner && (
            <div className="pt-2 border-t">
              <p className="text-sm font-medium mb-2">Invite link</p>
              <div className="flex gap-2 items-center mb-2">
                <select className="border rounded px-2 text-sm" value={linkRole} onChange={e => setLinkRole(e.target.value as any)}>
                  <option value="viewer">Viewer</option>
                  <option value="editor">Editor</option>
                </select>
                <Button size="sm" variant="outline" onClick={generateLink}>Generate</Button>
                {inviteLink && <Button size="sm" variant="secondary" onClick={copyLink}>Copy</Button>}
              </div>
              {inviteLink && <div className="text-[10px] break-all bg-muted p-2 rounded select-all">{inviteLink}</div>}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={() => setOpen(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default InviteCollaboratorsDialog;