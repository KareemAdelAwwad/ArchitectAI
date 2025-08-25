import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ObjectId } from 'mongodb';
import { MongoPlanRepository } from '@/src/infrastructure/repositories/MongoPlanRepository';
import { updateTaskCompletion } from '@/src/application/usecases/updateTaskCompletion';

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { taskId, completed } = await request.json();
    if (!taskId || typeof completed !== 'boolean') {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const repo = new MongoPlanRepository();
    const plan = await repo.get(session.user.id, params.id);
    if (!plan) return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    const isOwner = plan.userId === session.user.id;
    const collaboratorEntry = (plan.collaborators || []).find(c => c.userId === session.user.id);
    if (!isOwner && collaboratorEntry?.role !== 'editor') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const ok = await updateTaskCompletion(repo, session.user.id, params.id, taskId, completed);
    if (!ok) return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating task status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}