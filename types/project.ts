export interface ProjectInput {
  title: string;
  description: string;
  projectType: 'Frontend' | 'Backend' | 'Full Stack';
  techStack: string[];
  targetUsers: string;
  timeline: string;
  budget: string;
  specificRequirements: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  complexity: 'Simple' | 'Medium' | 'Complex';
  estimatedHours: number;
  dependencies: string[];
  category: string;
}

export interface TaskCollection {
  frontend: Task[];
  backend: Task[];
  integration: Task[];
  deployment: Task[];
}

export interface PlanningPhase {
  scope: string[];
  objectives: string[];
  stakeholders: string[];
  timeline: string;
  resources: string[];
  risks: string[];
}

export interface AnalysisPhase {
  functionalRequirements: string[];
  nonFunctionalRequirements: string[];
  userStories: string[];
  constraints: string[];
  integrations: string[];
}

export interface DesignPhase {
  systemArchitecture: string[];
  databaseSchema: string[];
  apiEndpoints: string[];
  uiDesign: string[];
  codingStandards: string[];
}

export interface WaterfallPhases {
  planning: PlanningPhase;
  analysis: AnalysisPhase;
  design: DesignPhase;
}

export interface ProjectOverview {
  title: string;
  description: string;
  projectType: string;
  techStack: string[];
  timeline: string;
}

export interface ProjectPlan {
  overview: ProjectOverview;
  tasks: TaskCollection;
  waterfallPhases: WaterfallPhases;
}