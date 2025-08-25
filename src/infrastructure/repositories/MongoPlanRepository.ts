import { ObjectId } from 'mongodb';
import { getDb } from '../db/mongoClient';
import { PlanRepository, StoredPlan } from '@/src/domain/repositories/PlanRepository';
import { ProjectPlan } from '@/src/domain/models/Project';

export class MongoPlanRepository implements PlanRepository {
  async list(userId: string): Promise<StoredPlan[]> {
    const db = await getDb();
    return db.collection('plans').find({ userId }).sort({ createdAt: -1 }).toArray() as any;
  }
  async get(userId: string, id: string): Promise<StoredPlan | null> {
    const db = await getDb();
    return db.collection('plans').findOne({ _id: new ObjectId(id), userId }) as any;
  }
  async create(userId: string, plan: ProjectPlan): Promise<StoredPlan> {
    const db = await getDb();
    const doc = { userId, plan, createdAt: new Date(), updatedAt: new Date() };
    const res = await db.collection('plans').insertOne(doc);
    return { _id: res.insertedId, ...doc } as any;
  }
  async delete(userId: string, id: string): Promise<boolean> {
    const db = await getDb();
    const res = await db.collection('plans').deleteOne({ _id: new ObjectId(id), userId });
    return res.deletedCount === 1;
  }
  async updateTasks(userId: string, id: string, tasks: ProjectPlan['tasks']): Promise<boolean> {
    const db = await getDb();
    const res = await db.collection('plans').updateOne({ _id: new ObjectId(id), userId }, { $set: { 'plan.tasks': tasks, updatedAt: new Date() } });
    return res.modifiedCount === 1;
  }
  async updateSection(userId: string, id: string, path: string, value: any): Promise<boolean> {
    const db = await getDb();
    const res = await db.collection('plans').updateOne({ _id: new ObjectId(id), userId }, { $set: { [`plan.${path}`]: value, updatedAt: new Date() } });
    return res.modifiedCount === 1;
  }
}
