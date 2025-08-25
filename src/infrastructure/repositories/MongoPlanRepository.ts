import { ObjectId } from 'mongodb';
import { getDb } from '../db/mongoClient';
import { PlanRepository, StoredPlan } from '@/src/domain/repositories/PlanRepository';
import { ProjectPlan } from '@/src/domain/models/Project';

export class MongoPlanRepository implements PlanRepository {
  async list(userId: string): Promise<StoredPlan[]> {
    const db = await getDb();
    return db.collection('plans')
      .find({ $or: [{ userId }, { 'collaborators.userId': userId }] })
      .sort({ createdAt: -1 })
      .toArray() as any;
  }
  async get(userId: string, id: string): Promise<StoredPlan | null> {
    const db = await getDb();
    return db.collection('plans').findOne({ _id: new ObjectId(id), $or: [{ userId }, { 'collaborators.userId': userId }] }) as any;
  }
  async create(userId: string, plan: ProjectPlan): Promise<StoredPlan> {
    const db = await getDb();
    const doc = { userId, plan, collaborators: [], createdAt: new Date(), updatedAt: new Date() };
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
    const res = await db.collection('plans').updateOne({ _id: new ObjectId(id), $or: [{ userId }, { 'collaborators': { $elemMatch: { userId, role: 'editor' } } }] }, { $set: { 'plan.tasks': tasks, updatedAt: new Date() } });
    return res.modifiedCount === 1;
  }
  async updateSection(userId: string, id: string, path: string, value: any): Promise<boolean> {
    const db = await getDb();
    const res = await db.collection('plans').updateOne({ _id: new ObjectId(id), $or: [{ userId }, { 'collaborators': { $elemMatch: { userId, role: 'editor' } } }] }, { $set: { [`plan.${path}`]: value, updatedAt: new Date() } });
    return res.modifiedCount === 1;
  }
  async addCollaborator(ownerId: string, id: string, collaboratorUserId: string, role: 'viewer' | 'editor'): Promise<boolean> {
    const db = await getDb();
    const res = await db.collection('plans').updateOne(
      { _id: new ObjectId(id), userId: ownerId, 'collaborators.userId': { $ne: collaboratorUserId } },
      { $push: { collaborators: { userId: collaboratorUserId, role } }, $set: { updatedAt: new Date() } } as any
    );
    return res.modifiedCount === 1;
  }
  async removeCollaborator(userId: string, id: string, collaboratorUserId: string): Promise<boolean> {
    const db = await getDb();
    // Allow owner to remove anyone OR collaborator to remove self (leave)
    const plan = await db.collection('plans').findOne({ _id: new ObjectId(id) });
    if (!plan) return false;
    if (plan.userId !== userId && collaboratorUserId !== userId) return false;
    const res = await db.collection('plans').updateOne(
      { _id: new ObjectId(id) },
      { $pull: { collaborators: { userId: collaboratorUserId } }, $set: { updatedAt: new Date() } } as any
    );
    return res.modifiedCount === 1;
  }
}
