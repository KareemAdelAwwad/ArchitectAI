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
  completed?: boolean;
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

// New lazily-generated Quick Start phase (not present until user requests it)
export interface QuickStartPhase {
  // Installation commands (ordered) tailored to selected package manager
  installCommands: string[];
  // Copilot instructions file metadata & content
  copilotInstructions: {
    filename: string; // normally "copilot-instructions.md"
    content: string;  // markdown content
  };
  // Package.json scripts snippet
  packageScripts: Record<string, string>;
  // .env.example content lines (each may include an inline comment starting with #)
  envExample: string[];
  // Package manager used to generate commands
  packageManager: 'npm' | 'yarn' | 'pnpm' | 'bun';
  generatedAt: string; // ISO timestamp
}

export interface WaterfallPhases {
  planning: PlanningPhase;
  analysis: AnalysisPhase;
  design: DesignPhase;
  // Optional Quick Start phase (undefined until generated on-demand)
  quickStart?: QuickStartPhase | null;
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
