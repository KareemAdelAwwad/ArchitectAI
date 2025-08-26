import Home from '@/app/page';
import Script from 'next/script';
import { notFound, redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { MongoPlanRepository } from '@/src/infrastructure/repositories/MongoPlanRepository';
import { ObjectId } from 'mongodb';

export const dynamic = 'force-dynamic';

export default async function PlanEntryPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect('/auth/signin');
  if (!ObjectId.isValid(params.id)) return notFound();
  const repo = new MongoPlanRepository();
  const stored: any = await repo.get(session.user.id, params.id);
  if (!stored) return notFound();
  const isOwner = stored.userId === session.user.id;
  const collaboratorRole = !isOwner && Array.isArray(stored.collaborators)
    ? stored.collaborators.find((c: any) => c.userId === session.user.id)?.role || null
    : null;
  // Serialize minimal safe plan (no functions). Avoid XSS by JSON.stringify.
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
