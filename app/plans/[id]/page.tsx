import Home from '@/app/page';
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
  const stored = await repo.get(session.user.id, params.id);
  if (!stored) return notFound();
  const isOwner = stored.userId === session.user.id;
  // For now just render root app; future enhancement could pre-hydrate plan via context.
  return <Home />;
}
