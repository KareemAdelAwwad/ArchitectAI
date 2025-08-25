import { ProjectPlan } from '../models/Project';

export interface StoredPlan {
  _id: any; // ObjectId in Mongo implementation
  userId: string;
  plan: ProjectPlan;
  createdAt: Date;
  updatedAt: Date;
  collaborators?: Array<{
    userId: string; // referenced user id
    role: 'viewer' | 'editor';
  }>;
}

export interface PlanRepository {
  list(userId: string): Promise<StoredPlan[]>;
  // get only if user is owner or collaborator
  get(userId: string, id: string): Promise<StoredPlan | null>;
  create(userId: string, plan: ProjectPlan): Promise<StoredPlan>;
  delete(userId: string, id: string): Promise<boolean>;
  updateTasks(userId: string, id: string, tasks: ProjectPlan['tasks']): Promise<boolean>;
  updateSection(userId: string, id: string, path: string, value: any): Promise<boolean>;
  addCollaborator(ownerId: string, id: string, collaboratorUserId: string, role: 'viewer' | 'editor'): Promise<boolean>;
  removeCollaborator(userId: string, id: string, collaboratorUserId: string): Promise<boolean>; // owner can remove, collaborator can self-remove
}
