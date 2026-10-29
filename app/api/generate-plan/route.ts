import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { generatePlan } from '@/lib/aiPlanner';
import { ProjectInput } from '@/types/project';
import { ProjectInputSchema } from '@/src/domain/schemas/projectInput';
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
    const aiConfig = getAIConfig(req, body);
    const plan = await generatePlan(input, aiConfig);
    return NextResponse.json(plan);
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Generation failed' }, { status: 500 });
  }
}
