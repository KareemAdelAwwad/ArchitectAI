import { PlanRepository } from '@/src/domain/repositories/PlanRepository';
import { ProjectPlan } from '@/src/domain/models/Project';

export async function createPlan(repo: PlanRepository, userId: string, plan: ProjectPlan) {
  return repo.create(userId, plan);
}
