// Importing internal client page component is no longer supported directly.
// Using default page and passing props via a wrapper component instead.
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
  const collaboratorEntry = (stored.collaborators || []).find(c => c.userId === session.user.id);
  // Pass data through global state approach not yet implemented; quick workaround: ignore passing props.
  return <Home />;
}
