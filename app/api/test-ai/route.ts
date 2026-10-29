import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { apiKey, baseURL, model } = body as {
      apiKey?: string;
      baseURL?: string;
      model?: string;
    };

    const resolvedKey = apiKey?.trim() || process.env.OPENAI_API_KEY || 'dummy';
    const resolvedBaseURL = baseURL?.trim() || process.env.OPENAI_BASE_URL || undefined;
    const resolvedModel = model?.trim() || process.env.OPENAI_MODEL || 'gemini-2.5-pro';

    if (!resolvedKey && !resolvedBaseURL?.includes('localhost')) {
      return NextResponse.json({ success: false, error: 'API key is required' }, { status: 400 });
    }

    const client = new OpenAI({
      apiKey: resolvedKey,
      baseURL: resolvedBaseURL,
      timeout: 15000,
    });

    const response = await client.chat.completions.create({
      model: resolvedModel,
      messages: [{ role: 'user', content: 'Ping. Respond with OK.' }],
      max_tokens: 5,
    });

    const reply = response.choices[0]?.message?.content?.trim() || 'OK';

    return NextResponse.json({
      success: true,
      model: resolvedModel,
      reply,
    });
  } catch (e: any) {
    console.error('[Test AI Connection Error]', e);
    const message = e?.message || 'Connection failed';
    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 400 }
    );
  }
}
