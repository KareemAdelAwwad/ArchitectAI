import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { MongoPlanRepository } from '@/src/infrastructure/repositories/MongoPlanRepository';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await req.json();
    const { techStack } = body as { techStack?: string[] };
    if (!Array.isArray(techStack)) return NextResponse.json({ error: 'techStack must be array' }, { status: 400 });
    const repo = new MongoPlanRepository();
    const stored = await repo.get(session.user.id, params.id);
    if (!stored) return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    const isOwner = stored.userId === session.user.id;
    const collaboratorEntry = (stored.collaborators || []).find(c => c.userId === session.user.id);
    if (!isOwner && collaboratorEntry?.role !== 'editor') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const cleaned = Array.from(new Set(techStack.map(t => String(t).trim()).filter(Boolean)));
    await repo.updateSection(session.user.id, params.id, 'overview.techStack', cleaned);
    return NextResponse.json({ success: true, techStack: cleaned });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Update failed' }, { status: 500 });
  }
}