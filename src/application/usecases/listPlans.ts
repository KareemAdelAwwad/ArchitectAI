import { PlanRepository } from '@/src/domain/repositories/PlanRepository';

export async function listPlans(repo: PlanRepository, userId: string) {
  return repo.list(userId);
}
