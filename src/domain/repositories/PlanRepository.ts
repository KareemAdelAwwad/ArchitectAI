import { ProjectPlan } from '../models/Project';

export interface StoredPlan {
  _id: any; // ObjectId in Mongo implementation
  userId: string;
  plan: ProjectPlan;
  createdAt: Date;
  updatedAt: Date;
}

export interface PlanRepository {
  list(userId: string): Promise<StoredPlan[]>;
  get(userId: string, id: string): Promise<StoredPlan | null>;
  create(userId: string, plan: ProjectPlan): Promise<StoredPlan>;
  delete(userId: string, id: string): Promise<boolean>;
  updateTasks(userId: string, id: string, tasks: ProjectPlan['tasks']): Promise<boolean>;
  updateSection(userId: string, id: string, path: string, value: any): Promise<boolean>;
}
