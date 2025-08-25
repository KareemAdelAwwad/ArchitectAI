import { PlanRepository } from '@/src/domain/repositories/PlanRepository';

export async function persistRefinedSection(repo: PlanRepository, userId: string, planId: string, section: string, value: any) {
  // section comes like tasks.backend or waterfallPhases.design.databaseSchema
  return repo.updateSection(userId, planId, section, value);
}
