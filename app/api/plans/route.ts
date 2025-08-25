import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';
import { ProjectPlan } from '@/types/project';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db('project-planner');
    const plans = await db
      .collection('plans')
      .find({ userId: session.user.id })
      .sort({ createdAt: -1 })
      .toArray();

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

    const client = await clientPromise;
    const db = client.db('project-planner');
    
    const planDocument = {
      userId: session.user.id,
      plan,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection('plans').insertOne(planDocument);

    return NextResponse.json({ 
      id: result.insertedId,
      ...planDocument 
    });
  } catch (error) {
    console.error('Error saving plan:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}