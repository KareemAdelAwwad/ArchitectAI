import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDb } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { refinePlanSectionWithGemini } from '@/lib/aiPlanner';
import { ProjectPlan } from '@/types/project';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/*
POST /api/refine-plan-section
Body: { planId?: string; fullPlan?: ProjectPlan; section: string; instruction: string }
If planId provided we fetch from DB (and verify ownership). Otherwise use fullPlan passed from client.
Returns: { section: string, value: any }
*/
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { planId, fullPlan, section, instruction } = body as { planId?: string; fullPlan?: ProjectPlan; section: string; instruction: string };
    if (!section) return NextResponse.json({ error: 'Missing section' }, { status: 400 });

    let plan: ProjectPlan | null = null;
    if (planId) {
      const db = await getDb();
      const doc = await db.collection('plans').findOne({ _id: new ObjectId(planId), userId: session.user.id });
      if (!doc) return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
      plan = doc.plan as ProjectPlan;
    } else if (fullPlan) {
      plan = fullPlan;
    } else {
      return NextResponse.json({ error: 'Provide planId or fullPlan' }, { status: 400 });
    }

    const refinedValue = await refinePlanSectionWithGemini(plan, section, instruction);

    // If planId provided, persist change
    if (planId) {
      const db = await getDb();
      // Apply updated section into plan object
      const pathSegments = section.split('.');
      let cursor: any = plan;
      for (let i = 0; i < pathSegments.length - 1; i++) {
        cursor = cursor[pathSegments[i]];
        if (cursor == null) break;
      }
      const lastKey = pathSegments[pathSegments.length - 1];
      if (cursor) {
        cursor[lastKey] = refinedValue;
      }
      await db.collection('plans').updateOne(
        { _id: new ObjectId(planId), userId: session.user.id },
        { $set: { plan, updatedAt: new Date() } }
      );
    }

    return NextResponse.json({ section, value: refinedValue });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Refine failed' }, { status: 500 });
  }
}
