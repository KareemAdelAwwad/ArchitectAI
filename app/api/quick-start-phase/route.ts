import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { MongoPlanRepository } from '@/src/infrastructure/repositories/MongoPlanRepository';
import { generateQuickStartPhase } from '@/lib/quickStartPlanner';
import { ProjectPlan } from '@/types/project';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/*
POST /api/quick-start-phase
Body: { planId?: string; fullPlan?: ProjectPlan; packageManager?: 'npm'|'yarn'|'pnpm'|'bun' }
If planId provided, loads plan & persists quickStart phase. Otherwise returns generated phase (client may integrate before saving full plan).
*/
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await req.json();
    const { planId, fullPlan, packageManager, force } = body as { planId?: string; fullPlan?: ProjectPlan; packageManager?: 'npm' | 'yarn' | 'pnpm' | 'bun'; force?: boolean };
    let plan: ProjectPlan | null = null;
    const repo = new MongoPlanRepository();
    if (planId) {
      const stored = await repo.get(session.user.id, planId);
      if (!stored) return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
      const isOwner = stored.userId === session.user.id;
      const collaboratorEntry = (stored.collaborators || []).find(c => c.userId === session.user.id);
      if (!isOwner && collaboratorEntry?.role !== 'editor') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      plan = stored.plan as ProjectPlan;
    } else if (fullPlan) {
      plan = fullPlan;
    } else {
      return NextResponse.json({ error: 'Provide planId or fullPlan' }, { status: 400 });
    }
    // Already generated? return existing unless force param later
    if (plan.waterfallPhases.quickStart && !force) return NextResponse.json({ quickStart: plan.waterfallPhases.quickStart, cached: true });
    const quickStart = await generateQuickStartPhase(plan, packageManager);
    // Persist if planId
    if (planId) {
      await repo.updateSection(session.user.id, planId, 'waterfallPhases.quickStart', quickStart);
    }
    return NextResponse.json({ quickStart });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Generation failed' }, { status: 500 });
  }
}
