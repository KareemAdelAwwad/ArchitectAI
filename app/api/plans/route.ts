import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ProjectPlan } from '@/types/project';
import { MongoPlanRepository } from '@/src/infrastructure/repositories/MongoPlanRepository';
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
    return NextResponse.json(plans);
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