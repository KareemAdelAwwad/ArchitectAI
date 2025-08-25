import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { MongoPlanRepository } from '@/src/infrastructure/repositories/MongoPlanRepository';
import { getDb } from '@/src/infrastructure/db/mongoClient';
import { ObjectId } from 'mongodb';

/*
POST /api/plans/:id/collaborators { userId, role }
 - Only owner can add collaborators.
DELETE /api/plans/:id/collaborators?userId=xyz
 - Owner can remove any collaborator.
 - Collaborator can remove self (leave).
GET returns collaborators metadata for current plan (owner only or collaborator can view list?). We'll allow any participant to view.
*/

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!ObjectId.isValid(params.id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  const repo = new MongoPlanRepository();
  const plan = await repo.get(session.user.id, params.id);
  if (!plan) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const db = await getDb();
  const userIds = [plan.userId, ...(plan.collaborators || []).map(c => c.userId)];
  const unique = Array.from(new Set(userIds));
  const users = await db.collection('users').find({ $or: [{ id: { $in: unique } }, { _id: { $in: unique.filter(id => ObjectId.isValid(id)).map(id => new ObjectId(id)) } }] }).project({ id: 1, email: 1, name: 1 }).toArray();
  const byId: Record<string, any> = {};
  users.forEach(u => { const key = (u.id || u._id?.toString()); if (key) byId[key] = u; });
  const collaborators = (plan.collaborators || []).map(c => ({ ...c, email: byId[c.userId]?.email || null, name: byId[c.userId]?.name || null }));
  const owner = { userId: plan.userId, email: byId[plan.userId]?.email || null, name: byId[plan.userId]?.name || null };
  return NextResponse.json({ owner, collaborators });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!ObjectId.isValid(params.id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
    const body = await req.json();
    // Accept either legacy userId or email (preferred)
    const role: string = body.role;
    const email: string | undefined = body.email?.toLowerCase();
    const providedUserId: string | undefined = body.userId; // backward compatibility
    if (!['viewer', 'editor'].includes(role)) return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    if (!email && !providedUserId) return NextResponse.json({ error: 'Missing email' }, { status: 400 });
    const repo = new MongoPlanRepository();
    const plan = await repo.get(session.user.id, params.id);
    if (!plan || plan.userId !== session.user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    let targetUserId = providedUserId;
    if (email) {
      const db = await getDb();
      const user = await db.collection('users').findOne({ email });
      if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
      targetUserId = user.id || user._id?.toString();
    }
    if (!targetUserId) return NextResponse.json({ error: 'Unable to resolve user id' }, { status: 400 });
    if (plan.userId === targetUserId) return NextResponse.json({ error: 'Cannot invite owner' }, { status: 400 });
    const already = (plan.collaborators || []).some(c => c.userId === targetUserId);
    if (already) return NextResponse.json({ error: 'Already collaborator' }, { status: 400 });
    const ok = await repo.addCollaborator(session.user.id, params.id, targetUserId, role as 'viewer' | 'editor');
    if (!ok) return NextResponse.json({ error: 'Failed to add collaborator' }, { status: 400 });
    // Return enriched collaborator
    const db = await getDb();
    const user = await db.collection('users').findOne({ $or: [{ id: targetUserId }, { _id: ObjectId.isValid(targetUserId) ? new ObjectId(targetUserId) : undefined }] });
    return NextResponse.json({ success: true, collaborator: { userId: targetUserId, role, email: user?.email || null, name: user?.name || null } });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!ObjectId.isValid(params.id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
    const { userId, role } = await req.json();
    if (!userId || !['viewer', 'editor'].includes(role)) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    const db = await getDb();
    // Ensure owner
    const plan = await db.collection('plans').findOne({ _id: new ObjectId(params.id) });
    if (!plan || plan.userId !== session.user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const res = await db.collection('plans').updateOne(
      { _id: new ObjectId(params.id), 'collaborators.userId': userId },
      { $set: { 'collaborators.$.role': role, updatedAt: new Date() } }
    );
    if (!res.modifiedCount) return NextResponse.json({ error: 'Update failed' }, { status: 400 });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!ObjectId.isValid(params.id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
    const { searchParams } = new URL(req.url);
    const collaboratorUserId = searchParams.get('userId');
    if (!collaboratorUserId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    const repo = new MongoPlanRepository();
    const ok = await repo.removeCollaborator(session.user.id, params.id, collaboratorUserId);
    if (!ok) return NextResponse.json({ error: 'Forbidden or not found' }, { status: 403 });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed' }, { status: 500 });
  }
}
