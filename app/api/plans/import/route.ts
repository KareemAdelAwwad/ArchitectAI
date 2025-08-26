import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { MongoPlanRepository } from '@/src/infrastructure/repositories/MongoPlanRepository';
import { ProjectPlan } from '@/src/domain/models/Project';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // Support both multipart/form-data (file upload) and raw JSON body
    let plan: ProjectPlan | null = null;
    const contentType = req.headers.get('content-type') || '';
    if (contentType.includes('multipart/form-data')) {
      const form = await req.formData();
      const file = form.get('file');
      if (file && typeof file === 'object' && 'arrayBuffer' in file) {
        const text = Buffer.from(await (file as any).arrayBuffer()).toString('utf-8');
        const parsed = JSON.parse(text);
        plan = parsed.plan || parsed; // allow raw plan or wrapped object
      }
    } else {
      const bodyText = await req.text();
      try {
        const parsed = JSON.parse(bodyText);
        plan = parsed.plan || parsed; // allow raw plan or wrapped object
      } catch (e) {
        return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
      }
    }
    if (!plan || !plan.overview || !plan.tasks || !plan.waterfallPhases) {
      return NextResponse.json({ error: 'Malformed plan JSON' }, { status: 400 });
    }
    // Basic sanitization: clamp arrays lengths to avoid abuse
    const clampArray = (arr: any[], max: number) => Array.isArray(arr) ? arr.slice(0, max) : [];
    (['frontend', 'backend', 'integration', 'deployment'] as const).forEach(k => {
      if (plan && plan.tasks && plan.tasks[k]) plan.tasks[k] = clampArray(plan.tasks[k], 500);
    });
    const repo = new MongoPlanRepository();
    const stored = await repo.create(session.user.id, plan as any);
    return NextResponse.json({ _id: stored._id, plan: stored.plan });
  } catch (e) {
    console.error('Import failed', e);
    return NextResponse.json({ error: 'Import failed' }, { status: 500 });
  }
}
