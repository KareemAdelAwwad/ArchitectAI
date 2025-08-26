import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ObjectId } from 'mongodb';
import { getDb } from '@/src/infrastructure/db/mongoClient';
import crypto from 'crypto';

// POST: generate invite link (owner only). Body { role }
// PUT: consume invite link (authenticated user joins with token) Body { token }

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!ObjectId.isValid(params.id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  const { role } = await req.json();
  if (!['viewer', 'editor'].includes(role)) return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
  const db = await getDb();
  const plan = await db.collection('plans').findOne({ _id: new ObjectId(params.id), userId: session.user.id });
  if (!plan) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const token = crypto.randomBytes(16).toString('hex');
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7); // 7 days
  await db.collection('plan_invites').insertOne({ planId: params.id, token, role, creatorId: session.user.id, createdAt: new Date(), expiresAt, used: false });
  // Provide a user-facing URL that, when visited after authentication, will auto-join the plan
  // Plan page will detect ?inviteToken= and consume it server-side.
  // Ensure absolute URL; fallback to localhost during development if env not provided.
  const base = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '');
  return NextResponse.json({ token, url: `${base}/plans/${params.id}?inviteToken=${token}` });
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!ObjectId.isValid(params.id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  const { token } = await req.json();
  if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 400 });
  const db = await getDb();
  const invite = await db.collection('plan_invites').findOne({ token, planId: params.id });
  if (!invite) return NextResponse.json({ error: 'Invalid token' }, { status: 404 });
  if (invite.used) return NextResponse.json({ error: 'Token used' }, { status: 400 });
  if (invite.expiresAt && new Date(invite.expiresAt) < new Date()) return NextResponse.json({ error: 'Expired' }, { status: 400 });
  const plan = await db.collection('plans').findOne({ _id: new ObjectId(params.id) });
  if (!plan) return NextResponse.json({ error: 'Plan missing' }, { status: 404 });
  if (plan.userId === session.user.id) return NextResponse.json({ error: 'Owner already' }, { status: 400 });
  const already = (plan.collaborators || []).some((c: any) => c.userId === session.user.id);
  if (!already) {
    await db.collection('plans').updateOne(
      { _id: new ObjectId(params.id) },
      { $push: { collaborators: { userId: session.user.id, role: invite.role } }, $set: { updatedAt: new Date() } } as any
    );
  }
  await db.collection('plan_invites').updateOne({ _id: invite._id }, { $set: { used: true, usedAt: new Date(), usedBy: session.user.id } });
  return NextResponse.json({ success: true, role: invite.role });
}