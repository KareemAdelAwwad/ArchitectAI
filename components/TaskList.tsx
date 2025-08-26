"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, CheckCircle2, Circle, Smartphone, Server, Zap, Cloud, Trash2, Pencil } from "lucide-react";
import { TaskCollection, Task } from "@/types/project";

interface TaskListProps {
  tasks: TaskCollection;
  onToggleTask?: (taskId: string, completed: boolean) => void;
  readOnly?: boolean;
}

const getComplexityColor = (complexity: string) => {
  switch (complexity) {
    case "Simple":
      return "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-800";
    case "Medium":
      return "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-800";
    case "Complex":
      return "bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-900/40 dark:text-rose-300 dark:border-rose-800";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-neutral-800/60 dark:text-neutral-300 dark:border-neutral-700";
  }
};

const getCategoryIcon = (category: string) => {
  switch (category) {
    case "frontend":
      return <Smartphone className="w-4 h-4" />;
    case "backend":
      return <Server className="w-4 h-4" />;
    case "integration":
      return <Zap className="w-4 h-4" />;
    case "deployment":
      return <Cloud className="w-4 h-4" />;
    default:
      return <Circle className="w-4 h-4" />;
  }
};

export default function TaskList({ tasks, onToggleTask, readOnly }: TaskListProps) {
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());
  const [filterComplexity, setFilterComplexity] = useState<string>("all");
  const [deletedTasks, setDeletedTasks] = useState<Set<string>>(new Set());
  const [editedTasks, setEditedTasks] = useState<Map<string, Partial<Task>>>(new Map());
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<{ title: string; description: string; estimatedHours: number; complexity: Task['complexity'] } | null>(null);

  // Sync completed tasks when tasks prop changes
  useEffect(() => {
    const all = [
      ...tasks.frontend,
      ...tasks.backend,
      ...tasks.integration,
      ...tasks.deployment,
    ];
    setCompletedTasks(new Set(all.filter((t) => t.completed).map((t) => t.id)));
  }, [tasks]);

  const toggleTaskCompletion = (taskId: string) => {
    if (readOnly) return;
    setCompletedTasks((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId); else next.add(taskId);
      onToggleTask?.(taskId, next.has(taskId));
      return next;
    });
  };

  const mergeTask = (t: Task): Task => {
    const overrides = editedTasks.get(t.id);
    return overrides ? { ...t, ...overrides } : t;
  };

  const filterCategory = (list: Task[]) => {
    const base = list
      .filter(t => !deletedTasks.has(t.id))
      .map(mergeTask)
      .filter((t) => filterComplexity === "all" || t.complexity === filterComplexity);
    return base;
  };

  const filteredFrontend = filterCategory(tasks.frontend);
  const filteredBackend = filterCategory(tasks.backend);
  const filteredIntegration = filterCategory(tasks.integration);
  const filteredDeployment = filterCategory(tasks.deployment);

  const visibleTasks = [
    ...filteredFrontend,
    ...filteredBackend,
    ...filteredIntegration,
    ...filteredDeployment,
  ];
  const completedVisible = visibleTasks.filter((t) => completedTasks.has(t.id)).length;
  const completionRate = visibleTasks.length
    ? (completedVisible / visibleTasks.length) * 100
    : 0;
  const totalVisibleHours = visibleTasks.reduce(
    (sum, task) => sum + task.estimatedHours,
    0
  );

  const renderCategory = (
    categoryTasks: Task[],
    label: string,
    icon: React.ReactNode
  ) => {
    const done = categoryTasks.filter((t) => completedTasks.has(t.id)).length;
    const pct = categoryTasks.length ? (done / categoryTasks.length) * 100 : 0;
    return (
      <Card className="border-neutral-200/60 dark:border-neutral-800/60 backdrop-blur-sm bg-white/70 dark:bg-neutral-900/40">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2 font-medium tracking-tight">
              {icon}
              {label}
            </span>
            <Badge variant="outline" className="text-xs">
              {done}/{categoryTasks.length}
            </Badge>
          </CardTitle>
          <CardDescription>
            <Progress value={pct} className="w-full mt-2" />
          </CardDescription>
        </CardHeader>
        <CardContent>
          {categoryTasks.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">
              No tasks match this complexity.
            </p>
          ) : (
            <div className="space-y-4">
              {[...categoryTasks]
                .sort((a, b) => {
                  const aDone = completedTasks.has(a.id);
                  const bDone = completedTasks.has(b.id);
                  if (aDone === bDone) return 0;
                  return aDone ? 1 : -1; // completed go last
                })
                .map((task) => {
                  const doneTask = completedTasks.has(task.id);
                  const applied = mergeTask(task);
                  return (
                    <div
                      key={task.id}
                      className={`group rounded-lg border p-4 transition-colors shadow-sm/5 hover:shadow-sm focus-within:ring-2 focus-within:ring-primary/30 outline-none ${doneTask
                        ? "bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/50"
                        : "bg-white/80 dark:bg-neutral-900/60 border-neutral-200 dark:border-neutral-800"
                        }`}
                    >
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={doneTask}
                          onCheckedChange={() => toggleTaskCompletion(task.id)}
                          className={`mt-1 ${readOnly ? "pointer-events-none opacity-60" : ""}`}
                          disabled={readOnly}
                          aria-label={doneTask ? "Mark task incomplete" : "Mark task complete"}
                        />
                        <div className="flex-1">
                          <div className="mb-2 flex items-start justify-between gap-4">
                            <h4
                              className={`font-semibold leading-snug tracking-tight ${doneTask ? "line-through text-muted-foreground" : ""
                                }`}
                            >
                              {applied.title}
                            </h4>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <Badge className={getComplexityColor(applied.complexity)}>
                                {applied.complexity}
                              </Badge>
                              <Badge
                                variant="outline"
                                className="flex items-center gap-1 text-xs"
                              >
                                <Clock className="h-3 w-3" />
                                {applied.estimatedHours}h
                              </Badge>
                              {!readOnly && (
                                <div className="flex items-center gap-1 ml-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (confirm('Delete this task locally? (Not persisted)')) {
                                        setDeletedTasks(prev => new Set(prev).add(task.id));
                                      }
                                    }}
                                    className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/30 text-red-600"
                                    aria-label="Delete task"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEditingTaskId(task.id);
                                      setEditDraft({ title: applied.title, description: applied.description, estimatedHours: applied.estimatedHours, complexity: applied.complexity });
                                    }}
                                    className="p-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/30 text-blue-600"
                                    aria-label="Edit task"
                                  >
                                    <Pencil className="w-4 h-4" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                          <p
                            className={`mb-2 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400 ${doneTask ? "line-through opacity-70" : ""
                              }`}
                          >
                            {applied.description}
                          </p>
                          {task.dependencies.length > 0 && (
                            <div className="text-xs text-neutral-500 dark:text-neutral-500">
                              <span className="font-medium">Dependencies:</span>{" "}
                              {task.dependencies.join(", ")}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  // Editing modal (simple inline overlay)
  const saveEdit = () => {
    if (!editingTaskId || !editDraft) return;
    setEditedTasks(prev => { const m = new Map(prev); m.set(editingTaskId, { ...editDraft }); return m; });
    setEditingTaskId(null); setEditDraft(null);
  };
  const cancelEdit = () => { setEditingTaskId(null); setEditDraft(null); };

  return (
    <div className="space-y-6 relative">
      {/* Progress Overview */}
      <Card className="border-neutral-200/60 dark:border-neutral-800/60 bg-white/70 dark:bg-neutral-900/40 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-semibold tracking-tight">
            <CheckCircle2 className="h-5 w-5 text-emerald-500" /> Project Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 grid gap-4 md:grid-cols-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {visibleTasks.length}
              </div>
              <div className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                Visible Tasks
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {completedVisible}
              </div>
              <div className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                Completed (Visible)
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                {totalVisibleHours}
              </div>
              <div className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                Hours (Visible)
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-fuchsia-600 dark:text-fuchsia-400">
                {Math.round(completionRate)}%
              </div>
              <div className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                Complete (Visible)
              </div>
            </div>
          </div>
          <Progress value={completionRate} className="w-full" />
        </CardContent>
      </Card>

      {/* Filter Controls */}
      <div className="flex gap-4">
        <Select value={filterComplexity} onValueChange={setFilterComplexity}>
          <SelectTrigger className="w-52">
            <SelectValue placeholder="Filter complexity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Complexity Levels</SelectItem>
            <SelectItem value="Simple">Simple Tasks</SelectItem>
            <SelectItem value="Medium">Medium Tasks</SelectItem>
            <SelectItem value="Complex">Complex Tasks</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Task Categories */}
      <Tabs defaultValue="all" className="space-y-6">
        <TabsList className="relative grid w-full grid-cols-5 rounded-full p-0.5 bg-neutral-100/70 dark:bg-neutral-900/60 backdrop-blur-xl border border-border/60 overflow-hidden before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.55),transparent_55%)] before:dark:bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.07),transparent_60%)] before:pointer-events-none">
          {[
            { key: 'all', label: 'All Tasks' },
            { key: 'frontend', label: 'Frontend' },
            { key: 'backend', label: 'Backend' },
            { key: 'integration', label: 'Integration' },
            { key: 'deployment', label: 'Deployment' }
          ].map(t => (
            <TabsTrigger
              key={t.key}
              value={t.key}
              className="relative rounded-full px-3 py-2 text-[11px] md:text-sm font-medium data-[state=active]:text-neutral-900 dark:data-[state=active]:text-neutral-50 data-[state=inactive]:text-neutral-600 dark:data-[state=inactive]:text-neutral-400 data-[state=active]:shadow-sm transition-all overflow-hidden data-[state=active]:bg-white/80 data-[state=active]:dark:bg-neutral-800/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500/50"
            >
              <span className="relative z-10">{t.label}</span>
              <span className="absolute inset-0 opacity-0 data-[state=active]:opacity-100 bg-[linear-gradient(135deg,var(--tw-gradient-stops))] from-indigo-500/20 via-fuchsia-500/15 to-purple-500/25 dark:from-indigo-400/25 dark:via-fuchsia-400/15 dark:to-purple-400/25" />
              <span className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-indigo-500/0 data-[state=active]:ring-indigo-500/30 rounded-full" />
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="all" className="space-y-6">
          {renderCategory(filteredFrontend, "Frontend Tasks", getCategoryIcon("frontend"))}
          {renderCategory(filteredBackend, "Backend Tasks", getCategoryIcon("backend"))}
          {renderCategory(
            filteredIntegration,
            "Integration & Testing Tasks",
            getCategoryIcon("integration")
          )}
          {renderCategory(
            filteredDeployment,
            "Deployment & DevOps Tasks",
            getCategoryIcon("deployment")
          )}
        </TabsContent>
        <TabsContent value="frontend">
          {renderCategory(filteredFrontend, "Frontend Tasks", getCategoryIcon("frontend"))}
        </TabsContent>
        <TabsContent value="backend">
          {renderCategory(filteredBackend, "Backend Tasks", getCategoryIcon("backend"))}
        </TabsContent>
        <TabsContent value="integration">
          {renderCategory(
            filteredIntegration,
            "Integration & Testing Tasks",
            getCategoryIcon("integration")
          )}
        </TabsContent>
        <TabsContent value="deployment">
          {renderCategory(
            filteredDeployment,
            "Deployment & DevOps Tasks",
            getCategoryIcon("deployment")
          )}
        </TabsContent>
      </Tabs>
      {editingTaskId && editDraft && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-xl p-6 space-y-4">
            <h3 className="text-lg font-semibold">Edit Task</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium">Title</label>
                <input value={editDraft.title} onChange={e => setEditDraft(d => d && { ...d, title: e.target.value })} className="w-full mt-1 rounded border px-2 py-1 bg-white dark:bg-neutral-800 text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium">Description</label>
                <textarea value={editDraft.description} onChange={e => setEditDraft(d => d && { ...d, description: e.target.value })} rows={4} className="w-full mt-1 rounded border px-2 py-1 bg-white dark:bg-neutral-800 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium">Hours</label>
                  <input type="number" min={0} value={editDraft.estimatedHours} onChange={e => setEditDraft(d => d && { ...d, estimatedHours: Number(e.target.value) })} className="w-full mt-1 rounded border px-2 py-1 bg-white dark:bg-neutral-800 text-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium">Complexity</label>
                  <select value={editDraft.complexity} onChange={e => setEditDraft(d => d && { ...d, complexity: e.target.value as Task['complexity'] })} className="w-full mt-1 rounded border px-2 py-1 bg-white dark:bg-neutral-800 text-sm">
                    <option value="Simple">Simple</option>
                    <option value="Medium">Medium</option>
                    <option value="Complex">Complex</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={cancelEdit} className="px-3 py-1 text-sm rounded border bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700">Cancel</button>
              <button onClick={saveEdit} className="px-3 py-1 text-sm rounded bg-blue-600 text-white hover:bg-blue-700">Save</button>
            </div>
            <p className="text-[10px] text-neutral-500">Edits are local only (not yet saved to the plan).</p>
          </div>
        </div>
      )}
    </div>
  );
}