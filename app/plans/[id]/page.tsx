import Home from '@/app/page';
import Script from 'next/script';
import { notFound, redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { MongoPlanRepository } from '@/src/infrastructure/repositories/MongoPlanRepository';
import { ObjectId } from 'mongodb';
import { getDb } from '@/src/infrastructure/db/mongoClient';

interface PageProps {
  params: { id: string };
  searchParams?: { [key: string]: string | string[] | undefined };
}

export const dynamic = 'force-dynamic';

export default async function PlanEntryPage({ params, searchParams }: PageProps) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect('/auth/signin');
  if (!ObjectId.isValid(params.id)) return notFound();

  // Accept invite token if present (allows invited user to access plan).
  const inviteToken = typeof searchParams?.inviteToken === 'string' ? searchParams!.inviteToken : undefined;
  if (inviteToken) {
    try {
      const db = await getDb();
      const invite = await db.collection('plan_invites').findOne({ token: inviteToken, planId: params.id });
      if (invite) {
        const now = new Date();
        const isExpired = invite.expiresAt && new Date(invite.expiresAt) < now;
        if (!invite.used && !isExpired) {
          const plan = await db.collection('plans').findOne({ _id: new ObjectId(params.id) });
          // Only add if user not owner and not already collaborator
          if (plan && plan.userId !== session.user.id && !((plan.collaborators || []).some((c: any) => c.userId === session.user.id))) {
            await db.collection('plans').updateOne(
              { _id: new ObjectId(params.id) },
              { $push: { collaborators: { userId: session.user.id, role: invite.role } }, $set: { updatedAt: new Date() } } as any
            );
          }
          await db.collection('plan_invites').updateOne({ _id: invite._id }, { $set: { used: true, usedAt: new Date(), usedBy: session.user.id } });
        }
      }
    } catch {
      // Swallow errors; user may still have access via other means.
    }
  }

  const repo = new MongoPlanRepository();
  const stored: any = await repo.get(session.user.id, params.id);
  if (!stored) return notFound();
  const isOwner = stored.userId === session.user.id;
  const collaboratorRole = !isOwner && Array.isArray(stored.collaborators)
    ? stored.collaborators.find((c: any) => c.userId === session.user.id)?.role || null
    : null;
  const init = {
    initialPlan: stored.plan,
    initialPlanId: stored._id.toString(),
    initialIsOwner: isOwner,
    initialCollaboratorRole: collaboratorRole
  };
  return <>
    <Script id="home-init" strategy="beforeInteractive">{`window.__HOME_INIT__ = ${JSON.stringify(init)};`}</Script>
    <Home />
  </>;
}
