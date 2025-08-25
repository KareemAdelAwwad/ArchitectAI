import { PlanRepository } from '@/src/domain/repositories/PlanRepository';

export async function updateTaskCompletion(repo: PlanRepository, userId: string, planId: string, taskId: string, completed: boolean) {
  const plan = await repo.get(userId, planId);
  if (!plan) return false;
  const { tasks } = plan.plan;
  const cats: (keyof typeof tasks)[] = ['frontend', 'backend', 'integration', 'deployment'];
  let found = false;
  for (const c of cats) {
    tasks[c] = tasks[c].map(t => t.id === taskId ? { ...t, completed } : t);
    if (!found && tasks[c].some(t => t.id === taskId)) found = true;
  }
  if (!found) return false;
  return repo.updateTasks(userId, planId, tasks);
}
