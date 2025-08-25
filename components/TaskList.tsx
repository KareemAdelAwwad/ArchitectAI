'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Clock, CheckCircle2, Circle, Smartphone, Server, Zap, Cloud } from 'lucide-react';
import { TaskCollection, Task } from '@/types/project';

interface TaskListProps {
  tasks: TaskCollection;
  onToggleTask?: (taskId: string, completed: boolean) => void;
  readOnly?: boolean;
}

const getComplexityColor = (complexity: string) => {
  switch (complexity) {
    case 'Simple':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'Medium':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'Complex':
      return 'bg-red-100 text-red-800 border-red-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'frontend':
      return <Smartphone className="w-4 h-4" />;
    case 'backend':
      return <Server className="w-4 h-4" />;
    case 'integration':
      return <Zap className="w-4 h-4" />;
    case 'deployment':
      return <Cloud className="w-4 h-4" />;
    default:
      return <Circle className="w-4 h-4" />;
  }
};

export default function TaskList({ tasks, onToggleTask, readOnly }: TaskListProps) {
  // Track completed tasks per mounted TaskList instance
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());

  // Rebuild completion Set whenever the tasks prop changes (new project selected)
  useEffect(() => {
    const all = [
      ...tasks.frontend,
      ...tasks.backend,
      ...tasks.integration,
      ...tasks.deployment,
    ];
    setCompletedTasks(new Set(all.filter(t => t.completed).map(t => t.id)));
  }, [tasks]);
  const [filterComplexity, setFilterComplexity] = useState<string>('all');

  const allTasks = [
    ...tasks.frontend.map(task => ({ ...task, category: 'frontend' })),
    ...tasks.backend.map(task => ({ ...task, category: 'backend' })),
    ...tasks.integration.map(task => ({ ...task, category: 'integration' })),
    ...tasks.deployment.map(task => ({ ...task, category: 'deployment' })),
  ];

  const toggleTaskCompletion = (taskId: string) => {
    if (readOnly) return;
    const isCompleted = completedTasks.has(taskId);
    const newCompleted = new Set(completedTasks);
    if (isCompleted) newCompleted.delete(taskId); else newCompleted.add(taskId);
    setCompletedTasks(newCompleted);
    onToggleTask?.(taskId, !isCompleted);
  };

  // Helper to filter a category by selected complexity
  const getFilteredCategory = (list: Task[]) =>
    filterComplexity === 'all' ? list : list.filter(t => t.complexity === filterComplexity);

  const filteredFrontend = getFilteredCategory(tasks.frontend);
  const filteredBackend = getFilteredCategory(tasks.backend);
  const filteredIntegration = getFilteredCategory(tasks.integration);
  const filteredDeployment = getFilteredCategory(tasks.deployment);

  const visibleAllTasks = [
    ...filteredFrontend.map(task => ({ ...task, category: 'frontend' })),
    ...filteredBackend.map(task => ({ ...task, category: 'backend' })),
    ...filteredIntegration.map(task => ({ ...task, category: 'integration' })),
    ...filteredDeployment.map(task => ({ ...task, category: 'deployment' })),
  ];

  const completedVisibleTasks = visibleAllTasks.filter(t => completedTasks.has(t.id)).length;
  const completionRate = visibleAllTasks.length > 0 ? (completedVisibleTasks / visibleAllTasks.length) * 100 : 0;
  const totalEstimatedHours = visibleAllTasks.reduce((sum, task) => sum + task.estimatedHours, 0);

  const renderTaskCategory = (categoryTasks: Task[], categoryName: string, icon: React.ReactNode) => {
    const categoryCompletedTasks = categoryTasks.filter(task => completedTasks.has(task.id)).length;
    const categoryProgress = categoryTasks.length > 0 ? (categoryCompletedTasks / categoryTasks.length) * 100 : 0;

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              {icon}
              {categoryName}
            </span>
            <Badge variant="outline">
              {categoryCompletedTasks}/{categoryTasks.length}
            </Badge>
          </CardTitle>
          <CardDescription>
            <Progress value={categoryProgress} className="w-full mt-2" />
          </CardDescription>
        </CardHeader>
        <CardContent>
          {categoryTasks.length === 0 ? (
            <p className="text-sm text-gray-500 italic">No tasks match this complexity.</p>
          ) : (
            <div className="space-y-4">
              {categoryTasks.map((task) => (
                <div
                  key={task.id}
                  className={`p-4 border rounded-lg transition-all ${completedTasks.has(task.id)
                    ? 'bg-green-50 border-green-200 opacity-75'
                    : 'bg-white hover:shadow-md'
                    }`}
                >
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={completedTasks.has(task.id)}
                      onCheckedChange={() => toggleTaskCompletion(task.id)}
                      className={`mt-1 ${readOnly ? 'pointer-events-none opacity-60' : ''}`}
                      disabled={readOnly}
                    />
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className={`font-semibold ${completedTasks.has(task.id) ? 'line-through text-gray-500' : ''
                          }`}>
                          {task.title}
                        </h4>
                        <div className="flex items-center gap-2 ml-4">
                          <Badge className={getComplexityColor(task.complexity)}>
                            {task.complexity}
                          </Badge>
                          <Badge variant="outline" className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {task.estimatedHours}h
                          </Badge>
                        </div>
                      </div>
                      <p className={`text-sm text-gray-600 mb-2 ${completedTasks.has(task.id) ? 'line-through' : ''
                        }`}>
                        {task.description}
                      </p>
                      {task.dependencies.length > 0 && (
                        <div className="text-xs text-gray-500">
                          <span className="font-medium">Dependencies:</span> {task.dependencies.join(', ')}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
            Project Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{visibleAllTasks.length}</div>
              <div className="text-sm text-gray-600">Visible Tasks</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{completedVisibleTasks}</div>
              <div className="text-sm text-gray-600">Completed (Visible)</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{totalEstimatedHours}</div>
              <div className="text-sm text-gray-600">Hours (Visible)</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{Math.round(completionRate)}%</div>
              <div className="text-sm text-gray-600">Complete (Visible)</div>
            </div>
          </div>
          <Progress value={completionRate} className="w-full" />
        </CardContent>
      </Card>

      {/* Filter Controls */}
      <div className="flex gap-4">
        <Select value={filterComplexity} onValueChange={setFilterComplexity}>
          <SelectTrigger className="w-48">
            <SelectValue />
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

        <TabsContent value="all">
          <div className="grid gap-6">
            {renderTaskCategory(filteredFrontend, 'Frontend Tasks', getCategoryIcon('frontend'))}
            {renderTaskCategory(filteredBackend, 'Backend Tasks', getCategoryIcon('backend'))}
            {renderTaskCategory(filteredIntegration, 'Integration & Testing Tasks', getCategoryIcon('integration'))}
            {renderTaskCategory(filteredDeployment, 'Deployment & DevOps Tasks', getCategoryIcon('deployment'))}
          </div>
        </TabsContent>

        <TabsContent value="frontend">
          {renderTaskCategory(filteredFrontend, 'Frontend Tasks', getCategoryIcon('frontend'))}
        </TabsContent>

        <TabsContent value="backend">
          {renderTaskCategory(filteredBackend, 'Backend Tasks', getCategoryIcon('backend'))}
        </TabsContent>

        <TabsContent value="integration">
          {renderTaskCategory(filteredIntegration, 'Integration & Testing Tasks', getCategoryIcon('integration'))}
        </TabsContent>

        <TabsContent value="deployment">
          {renderTaskCategory(filteredDeployment, 'Deployment & DevOps Tasks', getCategoryIcon('deployment'))}
        </TabsContent>
      </Tabs>
    </div>
  );
}