import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { ObjectId } from 'mongodb';
import { authOptions } from '@/lib/auth';
import { MongoPlanRepository } from '@/src/infrastructure/repositories/MongoPlanRepository';
import { persistRefinedSection } from '@/src/application/usecases/refineSection';
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
    const repo = new MongoPlanRepository();
    if (planId) {
      if (!ObjectId.isValid(planId)) return NextResponse.json({ error: 'Invalid planId' }, { status: 400 });
      const stored = await repo.get(session.user.id, planId);
      if (!stored) return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
      const isOwner = stored.userId === session.user.id;
      const collaboratorEntry = (stored.collaborators || []).find(c => c.userId === session.user.id);
      if (!isOwner && collaboratorEntry?.role !== 'editor') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      plan = stored.plan as ProjectPlan;
    } else if (fullPlan) {
      plan = fullPlan;
    } else {
      return NextResponse.json({ error: 'Provide planId or fullPlan' }, { status: 400 });
    }

    const refinedValue = await refinePlanSectionWithGemini(plan, section, instruction);

    // If planId provided, persist change
    if (planId) await persistRefinedSection(repo, session.user.id, planId, section, refinedValue);

    return NextResponse.json({ section, value: refinedValue });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Refine failed' }, { status: 500 });
  }
}
