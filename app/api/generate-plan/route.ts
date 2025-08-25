import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { generatePlanWithGemini } from '@/lib/aiPlanner';
import { ProjectInput } from '@/types/project';
import { ProjectInputSchema } from '@/src/domain/schemas/projectInput';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    // Optional: allow generation only for authenticated users; comment out if public
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const body = await req.json();
    const parsed = ProjectInputSchema.safeParse(body.input);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', issues: parsed.error.issues }, { status: 400 });
    }
    const input: ProjectInput = parsed.data;
    const plan = await generatePlanWithGemini(input);
    return NextResponse.json(plan);
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Generation failed' }, { status: 500 });
  }
}