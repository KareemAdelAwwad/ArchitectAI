import { PlanRepository } from '@/src/domain/repositories/PlanRepository';

export async function updateTaskCompletion(repo: PlanRepository, userId: string, planId: string, taskId: string, completed: boolean) {
  const plan = await repo.get(userId, planId);
  if (!plan) return false;
  const { tasks } = plan.plan;
  const cats: (keyof typeof tasks)[] = ['frontend', 'backend', 'integration', 'deployment'];
  let found = false;
  for (const c of cats) {
    const idx = tasks[c].findIndex(t => t.id === taskId);
    if (idx !== -1) {
      const newTasks = [...tasks[c]];
      newTasks[idx] = { ...newTasks[idx], completed };
      tasks[c] = newTasks;
      found = true;
      break;
    }
  }
  if (!found) return false;
  return repo.updateTasks(userId, planId, tasks);
}
