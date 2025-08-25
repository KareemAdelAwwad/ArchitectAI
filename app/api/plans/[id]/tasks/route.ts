import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ObjectId } from 'mongodb';
import { getDb } from '@/lib/mongodb';

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

    const db = await getDb();
    const doc = await db.collection('plans').findOne({ _id: new ObjectId(params.id), userId: session.user.id });
    if (!doc) return NextResponse.json({ error: 'Plan not found' }, { status: 404 });

    let updated = false;
    const categories = ['frontend', 'backend', 'integration', 'deployment'] as const;
    for (const cat of categories) {
      const arr = doc.plan?.tasks?.[cat];
      if (Array.isArray(arr)) {
        const idx = arr.findIndex((t: any) => t.id === taskId);
        if (idx !== -1) {
          arr[idx].completed = completed;
          updated = true;
          break;
        }
      }
    }

    if (!updated) return NextResponse.json({ error: 'Task not found' }, { status: 404 });

    await db.collection('plans').updateOne({ _id: new ObjectId(params.id), userId: session.user.id }, { $set: { 'plan.tasks': doc.plan.tasks, updatedAt: new Date() } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating task status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}