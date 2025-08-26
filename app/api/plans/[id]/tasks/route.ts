import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { MongoPlanRepository } from '@/src/infrastructure/repositories/MongoPlanRepository';
import { updateTaskCompletion } from '@/src/application/usecases/updateTaskCompletion';

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { taskId } = body as { taskId?: string };
    if (!taskId) return NextResponse.json({ error: 'taskId required' }, { status: 400 });

    const repo = new MongoPlanRepository();
    const stored = await repo.get(session.user.id, params.id);
    if (!stored) return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    const isOwner = stored.userId === session.user.id;
    const collaboratorEntry = (stored.collaborators || []).find(c => c.userId === session.user.id);
    if (!isOwner && collaboratorEntry?.role !== 'editor') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    // Operation types: completion toggle, edit fields, delete task
    if (typeof body.completed === 'boolean') {
      const ok = await updateTaskCompletion(repo, session.user.id, params.id, taskId, body.completed);
      if (!ok) return NextResponse.json({ error: 'Task not found' }, { status: 404 });
      return NextResponse.json({ success: true, type: 'toggle' });
    }

    // Edit
    if (body.updates && typeof body.updates === 'object') {
      const tasks = stored.plan.tasks;
      const categories: (keyof typeof tasks)[] = ['frontend', 'backend', 'integration', 'deployment'];
      let found = false;
      for (const c of categories) {
        tasks[c] = tasks[c].map(t => {
          if (t.id === taskId) {
            found = true;
            return { ...t, ...body.updates };
          }
          return t;
        });
      }
      if (!found) return NextResponse.json({ error: 'Task not found' }, { status: 404 });
      await repo.updateTasks(session.user.id, params.id, tasks);
      return NextResponse.json({ success: true, type: 'edit', taskId });
    }

    // Delete
    if (body.delete === true) {
      const tasks = stored.plan.tasks;
      const categories: (keyof typeof tasks)[] = ['frontend', 'backend', 'integration', 'deployment'];
      let removed = false;
      for (const c of categories) {
        const before = tasks[c].length;
        tasks[c] = tasks[c].filter(t => t.id !== taskId);
        if (tasks[c].length !== before) removed = true;
      }
      if (!removed) return NextResponse.json({ error: 'Task not found' }, { status: 404 });
      await repo.updateTasks(session.user.id, params.id, tasks);
      return NextResponse.json({ success: true, type: 'delete', taskId });
    }

    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  } catch (error) {
    console.error('Error updating tasks:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}