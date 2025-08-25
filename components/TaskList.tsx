"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, CheckCircle2, Circle, Smartphone, Server, Zap, Cloud } from "lucide-react";
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

  const filterCategory = (list: Task[]) =>
    filterComplexity === "all" ? list : list.filter((t) => t.complexity === filterComplexity);

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
              {categoryTasks.map((task) => {
                const doneTask = completedTasks.has(task.id);
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
                            {task.title}
                          </h4>
                          <div className="flex items-center gap-2">
                            <Badge className={getComplexityColor(task.complexity)}>
                              {task.complexity}
                            </Badge>
                            <Badge
                              variant="outline"
                              className="flex items-center gap-1 text-xs"
                            >
                              <Clock className="h-3 w-3" />
                              {task.estimatedHours}h
                            </Badge>
                          </div>
                        </div>
                        <p
                          className={`mb-2 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400 ${doneTask ? "line-through opacity-70" : ""
                            }`}
                        >
                          {task.description}
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

  return (
    <div className="space-y-6">
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
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">All Tasks</TabsTrigger>
          <TabsTrigger value="frontend">Frontend</TabsTrigger>
          <TabsTrigger value="backend">Backend</TabsTrigger>
          <TabsTrigger value="integration">Integration</TabsTrigger>
          <TabsTrigger value="deployment">Deployment</TabsTrigger>
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
    </div>
  );
}