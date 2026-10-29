import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { ObjectId } from 'mongodb';
import { authOptions } from '@/lib/auth';
import { MongoPlanRepository } from '@/src/infrastructure/repositories/MongoPlanRepository';
import { generateQuickStartPhase } from '@/lib/quickStartPlanner';
import { ProjectPlan } from '@/types/project';
import { AIClientConfig } from '@/types/ai';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function getAIConfig(req: NextRequest, body?: any): AIClientConfig {
  return {
    apiKey: req.headers.get('x-ai-api-key') || body?.aiConfig?.apiKey || undefined,
    baseURL: req.headers.get('x-ai-base-url') || body?.aiConfig?.baseURL || undefined,
    model: req.headers.get('x-ai-model') || body?.aiConfig?.model || undefined,
  };
}

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
    if (planId && !ObjectId.isValid(planId)) {
      return NextResponse.json({ error: 'Invalid planId' }, { status: 400 });
    }
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
    // Already generated? return existing unless force requested.
    if (plan.waterfallPhases.quickStart && !force) {
      const qs = plan.waterfallPhases.quickStart;
      // Safety: ensure generatedAt is present & plausible (not older than 30 days or in future >5m)
      try {
        const now = Date.now();
        const ts = Date.parse(qs.generatedAt || '');
        const thirtyDays = 1000 * 60 * 60 * 24 * 30;
        const fiveMinutes = 1000 * 60 * 5;
        if (!qs.generatedAt || isNaN(ts) || (now - ts) > thirtyDays || (ts - now) > fiveMinutes) {
          qs.generatedAt = new Date().toISOString();
          if (planId) {
            await repo.updateSection(session.user.id, planId, 'waterfallPhases.quickStart.generatedAt', qs.generatedAt);
          }
        }
      } catch { /* non-fatal timestamp normalization */ }
      return NextResponse.json({ quickStart: plan.waterfallPhases.quickStart, cached: true });
    }
    const aiConfig = getAIConfig(req, body);
    const quickStart = await generateQuickStartPhase(plan, packageManager, aiConfig);
    // Persist if planId
    if (planId) {
      await repo.updateSection(session.user.id, planId, 'waterfallPhases.quickStart', quickStart);
    }
    return NextResponse.json({ quickStart });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Generation failed' }, { status: 500 });
  }
}
