import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ProjectPlan } from '@/types/project';
import { MongoPlanRepository } from '@/src/infrastructure/repositories/MongoPlanRepository';
import { getDb } from '@/src/infrastructure/db/mongoClient';
import { listPlans } from '@/src/application/usecases/listPlans';
import { createPlan } from '@/src/application/usecases/createPlan';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const repo = new MongoPlanRepository();
    const plans = await listPlans(repo, session.user.id);
    const db = await getDb();
    const allUserIds = Array.from(new Set(plans.flatMap(p => [p.userId, ...(p.collaborators || []).map(c => c.userId)])));
    const objectIds = allUserIds.filter(id => id && id.length === 24).map(id => new (require('mongodb').ObjectId)(id));
    const userDocs = await db.collection('users').find({ $or: [{ id: { $in: allUserIds } }, { _id: { $in: objectIds } }] }).project({ id: 1, email: 1, image: 1, name: 1 }).toArray();
    const userMap: Record<string, any> = {};
    userDocs.forEach(u => { const key = u.id || u._id?.toString(); if (key) userMap[key] = u; });
    const enriched = plans.map(p => {
      const isOwner = p.userId === session.user.id;
      const collaboratorEntry = (p.collaborators || []).find(c => c.userId === session.user.id);
      const collaboratorsDetailed = (p.collaborators || []).map(c => ({ ...c, email: userMap[c.userId]?.email || null, image: userMap[c.userId]?.image || null, name: userMap[c.userId]?.name || null }));
      const collaboratorCount = collaboratorsDetailed.length;
      const ownerProfile = userMap[p.userId] || null;
      return { ...p, isOwner, collaboratorRole: collaboratorEntry?.role, collaboratorCount, collaboratorsDetailed, ownerProfile };
    });
    return NextResponse.json(enriched);
  } catch (error) {
    console.error('Error fetching plans:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { plan }: { plan: ProjectPlan } = body;
    const repo = new MongoPlanRepository();
    const created = await createPlan(repo, session.user.id, plan);
    return NextResponse.json(created);
  } catch (error) {
    console.error('Error saving plan:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}