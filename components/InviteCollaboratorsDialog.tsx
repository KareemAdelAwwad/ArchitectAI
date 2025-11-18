"use client";
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { Copy, Check, XCircle, Users, Link as LinkIcon, UserPlus2, Shield, Filter } from 'lucide-react';

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
  const [copyState, setCopyState] = useState<'idle' | 'copied'>('idle');
  const [filter, setFilter] = useState('');
  const [generatingLink, setGeneratingLink] = useState(false);

  // Basic email pattern (simple, not exhaustive) for inline validation
  const emailValid = useMemo(() => /.+@.+\..+/.test(email.trim()), [email]);

  const filteredCollabs = useMemo(() => {
    if (!filter.trim()) return collabs;
    const f = filter.toLowerCase();
    return collabs.filter(c => (c.email || c.name || '').toLowerCase().includes(f));
  }, [collabs, filter]);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/plans/${planId}/collaborators`);
      if (res.ok) {
        const data = await res.json();
        setOwner({ userId: data.owner.userId, role: 'editor', email: data.owner.email, name: data.owner.name });
        setCollabs(data.collaborators || []);
      }
    } catch { /* ignore */ }
  }, [planId]);
  useEffect(() => { if (open) load(); }, [open, load]);

  const invite = useCallback(async () => {
    if (!email.trim() || !emailValid) return;
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
  }, [email, emailValid, planId, role, toast, onChanged]);

  const generateLink = async () => {
    setGeneratingLink(true);
    try {
      const res = await fetch(`/api/plans/${planId}/invite-link`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role: linkRole }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setInviteLink(data.url || null);
      setCopyState('idle');
      toast({ title: 'Invite link created', description: 'Copy and share with others.' });
    } catch (e: any) {
      toast({ title: 'Link failed', description: e.message, variant: 'destructive' as any });
    } finally {
      setGeneratingLink(false);
    }
  };

  const copyLink = async () => {
    if (!inviteLink) return;
    try { await navigator.clipboard.writeText(inviteLink); setCopyState('copied'); toast({ title: 'Copied', description: 'Invite link copied.' }); setTimeout(() => setCopyState('idle'), 2200); } catch { }
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

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && email && emailValid && !emailExists && isOwner && !loading) {
      invite();
    }
  }, [email, emailValid, emailExists, isOwner, loading, invite]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger || <Button size="sm" variant="outline">Share</Button>}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Users className="h-4 w-4" /> Share & Collaborate</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          {/* Invite Section */}
          <div className="rounded-md border p-3 bg-muted/30">
            <div className="flex items-center gap-2 mb-2">
              <UserPlus2 className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-medium">Invite by email</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2" onKeyDown={handleKeyDown}>
              <div className="flex-1 flex flex-col gap-1">
                <Input aria-label="Collaborator email" placeholder="user@example.com" value={email} onChange={e => setEmail(e.target.value)} disabled={!isOwner || loading} />
                <div className="min-h-[14px]">
                  {!emailValid && email && <p className="text-[10px] text-amber-600">Enter a valid email.</p>}
                  {emailExists && <p className="text-[10px] text-red-600">Email already a collaborator.</p>}
                </div>
              </div>
              <div className="w-full sm:w-40">
                <Select value={role} onValueChange={(v: any) => setRole(v)} disabled={!isOwner || loading}>
                  <SelectTrigger className="h-9 text-xs" aria-label="Role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="viewer">Viewer</SelectItem>
                    <SelectItem value="editor">Editor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button size="sm" className="sm:self-start" onClick={invite} disabled={Boolean(!isOwner || loading || !email || !emailValid || emailExists)}>
                {loading ? <Spinner size="xs" label="Inviting" /> : 'Invite'}
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground mt-2 flex flex-wrap gap-4">
              <span className="flex items-center gap-1"><Shield className="h-3 w-3" />Editor: can edit content</span>
              <span>Viewer: read-only access</span>
            </p>
          </div>

          {/* Collaborators List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium"><Users className="h-4 w-4 text-muted-foreground" /> Collaborators ({collabs.length})</div>
              {collabs.length > 4 && (
                <div className="relative">
                  <Input value={filter} onChange={e => setFilter(e.target.value)} placeholder="Filter" className="pl-7 h-8 text-xs w-40" />
                  <Filter className="h-3.5 w-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
                </div>
              )}
            </div>
            <ScrollArea className="max-h-72 pr-2">
              <div className="space-y-2">
                {owner && (
                  <div className="flex items-center justify-between rounded border p-2 bg-muted/50">
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-[10px]">{(owner.name || owner.email || 'O').slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{owner.name || owner.email || 'Owner'}</p>
                        <p className="text-xs text-muted-foreground truncate">{owner.email}</p>
                      </div>
                    </div>
                    <Badge variant="secondary">Owner</Badge>
                  </div>
                )}
                {filteredCollabs.map(c => (
                  <div key={c.userId} className="flex items-center justify-between rounded border p-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-[10px]">{(c.name || c.email || c.userId).slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{c.name || c.email || c.userId}</p>
                        <p className="text-xs text-muted-foreground truncate">{c.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isOwner && (
                        <Select value={c.role} onValueChange={(v: any) => updateRole(c.userId, v)}>
                          <SelectTrigger className="h-8 w-24 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="viewer">Viewer</SelectItem>
                            <SelectItem value="editor">Editor</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                      {isOwner && <Button size="sm" variant="ghost" className="h-8 px-2 text-xs" onClick={() => remove(c.userId)}>Remove</Button>}
                    </div>
                  </div>
                ))}
                {filteredCollabs.length === 0 && collabs.length > 0 && <p className="text-xs text-muted-foreground">No matches.</p>}
                {collabs.length === 0 && <p className="text-xs text-muted-foreground">No collaborators yet.</p>}
              </div>
            </ScrollArea>
          </div>

          {/* Invite Link */}
          {isOwner && (
            <div className="rounded-md border p-3 space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium"><LinkIcon className="h-4 w-4 text-muted-foreground" /> Invite link</div>
              <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                <Select value={linkRole} onValueChange={(v: any) => setLinkRole(v)}>
                  <SelectTrigger className="h-9 w-40 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="viewer">Viewer</SelectItem>
                    <SelectItem value="editor">Editor</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={generateLink} disabled={generatingLink}>
                    {generatingLink ? <Spinner size="xs" label="Generating" /> : 'Generate'}
                  </Button>
                  {inviteLink && (
                    <Button size="sm" variant="secondary" onClick={copyLink}>
                      {copyState === 'copied' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} {copyState === 'copied' ? 'Copied' : 'Copy'}
                    </Button>
                  )}
                  {inviteLink && (
                    <Button size="sm" variant="ghost" onClick={() => { setInviteLink(null); toast({ title: 'Invite link cleared' }); }}>
                      <XCircle className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
              {inviteLink && <div className="text-[10px] break-all bg-muted p-2 rounded select-all font-mono leading-relaxed">{inviteLink}</div>}
              <p className="text-[11px] text-muted-foreground">Anyone with this link will join as a <strong className="font-medium">{linkRole}</strong>.</p>
            </div>
          )}
        </div>
        <DialogFooter className="flex items-center justify-between mt-2">
          <Button variant="secondary" onClick={() => setOpen(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default InviteCollaboratorsDialog;