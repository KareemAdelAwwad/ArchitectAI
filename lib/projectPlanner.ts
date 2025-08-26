import { ProjectInput, ProjectPlan, Task, PlanningPhase, AnalysisPhase, DesignPhase } from '@/types/project';

const generateUniqueId = () => Math.random().toString(36).substr(2, 9);

const suggestTechStack = (projectType: string, description: string): string[] => {
  const suggestions: string[] = [];
  const descLower = description.toLowerCase();

  // Base suggestions by project type
  switch (projectType) {
    case 'Frontend':
      suggestions.push('React', 'TypeScript', 'Tailwind CSS');
      if (descLower.includes('spa') || descLower.includes('single page')) {
        suggestions.push('React Router', 'Zustand');
      } else {
        suggestions.push('Next.js');
      }
      break;
    case 'Backend':
      suggestions.push('Node.js', 'Express.js', 'TypeScript', 'PostgreSQL');
      if (descLower.includes('api') || descLower.includes('rest')) {
        suggestions.push('Swagger', 'JWT');
      }
      break;
    case 'Full Stack':
      suggestions.push('Next.js', 'TypeScript', 'Tailwind CSS', 'PostgreSQL', 'Prisma');
      break;
  }

  // Add specific technologies based on description keywords
  if (descLower.includes('auth') || descLower.includes('login') || descLower.includes('user')) {
    suggestions.push('NextAuth.js');
  }
  if (descLower.includes('payment') || descLower.includes('stripe')) {
    suggestions.push('Stripe');
  }
  if (descLower.includes('real-time') || descLower.includes('chat') || descLower.includes('live')) {
    suggestions.push('Socket.io');
  }
  if (descLower.includes('email')) {
    suggestions.push('Nodemailer', 'Resend');
  }
  if (descLower.includes('file') || descLower.includes('upload') || descLower.includes('image')) {
    suggestions.push('Cloudinary', 'AWS S3');
  }

  // Convert to array explicitly (avoid relying on spread of Set for ES5 target)
  return Array.from(new Set(suggestions));
};

const generatePlanningPhase = (input: ProjectInput): PlanningPhase => {
  const scope = [
    `Develop a ${input.projectType.toLowerCase()} ${input.title}`,
    'Create user-friendly interface with modern design principles',
    'Implement core functionality as defined in requirements',
    'Ensure responsive design across all device types',
    'Establish proper error handling and validation'
  ];

  if (input.projectType === 'Full Stack' || input.projectType === 'Backend') {
    scope.push('Design and implement scalable database architecture');
    scope.push('Create secure API endpoints with proper authentication');
  }

  const objectives = [
    'Deliver a production-ready application within the specified timeline',
    'Create an intuitive user experience that meets target user needs',
    'Implement industry-standard security practices',
    'Ensure optimal performance and scalability',
    'Establish maintainable and well-documented codebase'
  ];

  const stakeholders = [
    'Product Owner - Defines requirements and accepts deliverables',
    'Development Team - Implements the technical solution',
    'End Users - Primary users of the application',
    'QA Team - Ensures quality and functionality'
  ];

  if (input.targetUsers) {
    stakeholders.push(`Target Audience - ${input.targetUsers}`);
  }

  const resources = [
    'Frontend Developer(s) - UI/UX implementation',
    'Development Environment - IDE, version control, testing tools',
    'Hosting Platform - Cloud deployment and CI/CD pipeline'
  ];

  if (input.projectType === 'Full Stack' || input.projectType === 'Backend') {
    resources.push('Backend Developer(s) - Server-side logic and database design');
    resources.push('Database Management System - Data storage and retrieval');
  }

  const risks = [
    'Scope creep - Requirements may expand beyond initial specifications',
    'Technical complexity - Unforeseen technical challenges may arise',
    'Timeline delays - Development may take longer than estimated',
    'Integration issues - Third-party services may cause complications'
  ];

  if (input.budget === 'Under $1K') {
    risks.push('Budget constraints - Limited resources may impact feature scope');
  }

  return {
    scope,
    objectives,
    stakeholders,
    timeline: input.timeline || 'To be determined based on complexity analysis',
    resources,
    risks
  };
};

const generateAnalysisPhase = (input: ProjectInput): AnalysisPhase => {
  const functionalRequirements = [
    'User registration and authentication system',
    'Responsive design that works on desktop, tablet, and mobile',
    'Data validation and error handling throughout the application'
  ];

  const description = input.description.toLowerCase();

  // Add specific functional requirements based on project description
  if (description.includes('dashboard')) {
    functionalRequirements.push('Administrative dashboard with analytics and reporting');
  }
  if (description.includes('search')) {
    functionalRequirements.push('Search functionality with filtering and sorting options');
  }
  if (description.includes('notification')) {
    functionalRequirements.push('Real-time notification system');
  }
  if (description.includes('profile')) {
    functionalRequirements.push('User profile management with customizable settings');
  }
  if (description.includes('comment') || description.includes('review')) {
    functionalRequirements.push('User-generated content with moderation capabilities');
  }

  const nonFunctionalRequirements = [
    'Application should load within 3 seconds on standard internet connections',
    'System should handle concurrent users without performance degradation',
    'All user data must be encrypted and stored securely',
    'Application should maintain 99.5% uptime availability',
    'Code should follow industry best practices for maintainability'
  ];

  if (input.projectType === 'Full Stack' || input.projectType === 'Backend') {
    nonFunctionalRequirements.push('API response times should be under 200ms for standard operations');
    nonFunctionalRequirements.push('Database queries should be optimized for performance');
  }

  const userStories = [
    'As a user, I want to easily navigate the application so that I can find what I need quickly',
    'As a user, I want clear feedback when I perform actions so that I know the system is responding',
    'As a user, I want the application to work seamlessly on my mobile device'
  ];

  // Add project-specific user stories
  if (description.includes('login') || description.includes('auth')) {
    userStories.push('As a user, I want to securely log in to access my personal information');
  }
  if (description.includes('admin')) {
    userStories.push('As an admin, I want to manage users and content through an intuitive interface');
  }
  if (description.includes('social') || description.includes('share')) {
    userStories.push('As a user, I want to share content with others and interact socially');
  }

  const constraints = [
    'Must be developed using the specified technology stack',
    'Must comply with web accessibility standards (WCAG 2.1)',
    'Must work across major browsers (Chrome, Firefox, Safari, Edge)'
  ];

  if (input.budget) {
    constraints.push(`Budget constraint: ${input.budget}`);
  }
  if (input.timeline) {
    constraints.push(`Timeline constraint: ${input.timeline}`);
  }

  const integrations = [];
  if (description.includes('payment')) {
    integrations.push('Payment processing integration (Stripe, PayPal)');
  }
  if (description.includes('email')) {
    integrations.push('Email service integration for notifications');
  }
  if (description.includes('social') || description.includes('oauth')) {
    integrations.push('Social media authentication (Google, Facebook, GitHub)');
  }
  if (description.includes('analytics')) {
    integrations.push('Analytics platform integration (Google Analytics)');
  }
  if (integrations.length === 0) {
    integrations.push('No external integrations identified at this time');
  }

  return {
    functionalRequirements,
    nonFunctionalRequirements,
    userStories,
    constraints,
    integrations
  };
};

const generateDesignPhase = (input: ProjectInput): DesignPhase => {
  const systemArchitecture = [];

  if (input.projectType === 'Frontend') {
    systemArchitecture.push(
      'Single-page application (SPA) architecture with React',
      'Component-based architecture with reusable UI components',
      'State management using React hooks or context API',
      'Responsive grid system with CSS-in-JS or utility-first CSS'
    );
  } else if (input.projectType === 'Backend') {
    systemArchitecture.push(
      'RESTful API architecture with Node.js and Express',
      'Layered architecture: Controller → Service → Repository pattern',
      'Database abstraction layer with ORM/query builder',
      'Authentication middleware and request validation'
    );
  } else {
    systemArchitecture.push(
      'Full-stack Next.js application with API routes',
      'Server-side rendering (SSR) and static generation (SSG) where appropriate',
      'Microservices architecture for scalable backend services',
      'Database layer with connection pooling and optimization'
    );
  }

  const databaseSchema = [];
  if (input.projectType !== 'Frontend') {
    databaseSchema.push(
      'Users table: id, email, password_hash, profile_data, created_at, updated_at',
      'Sessions table: id, user_id, token, expires_at, created_at'
    );

    if (input.description.toLowerCase().includes('post') || input.description.toLowerCase().includes('content')) {
      databaseSchema.push('Content table: id, user_id, title, body, status, created_at, updated_at');
    }
    if (input.description.toLowerCase().includes('comment')) {
      databaseSchema.push('Comments table: id, content_id, user_id, body, created_at');
    }
    if (input.description.toLowerCase().includes('category') || input.description.toLowerCase().includes('tag')) {
      databaseSchema.push('Categories/Tags table: id, name, description, created_at');
    }
  } else {
    databaseSchema.push('Frontend-only project - no database schema required');
  }

  const apiEndpoints = [];
  if (input.projectType !== 'Frontend') {
    apiEndpoints.push(
      'POST /api/auth/login - User authentication',
      'POST /api/auth/register - User registration',
      'GET /api/auth/profile - Get user profile',
      'PUT /api/auth/profile - Update user profile'
    );

    if (input.description.toLowerCase().includes('crud') || input.description.toLowerCase().includes('manage')) {
      apiEndpoints.push(
        'GET /api/items - List items with pagination',
        'POST /api/items - Create new item',
        'GET /api/items/:id - Get specific item',
        'PUT /api/items/:id - Update item',
        'DELETE /api/items/:id - Delete item'
      );
    }
  } else {
    apiEndpoints.push('Frontend-only project - API endpoints will be external or mocked');
  }

  const uiDesign = [
    'Modern, clean interface with consistent color scheme and typography',
    'Mobile-first responsive design with breakpoints for tablet and desktop',
    'Intuitive navigation with breadcrumbs and clear page hierarchy',
    'Loading states and error handling with user-friendly messages',
    'Accessibility features including ARIA labels and keyboard navigation'
  ];

  if (input.description.toLowerCase().includes('dashboard')) {
    uiDesign.push('Dashboard layout with sidebar navigation and main content area');
  }
  if (input.description.toLowerCase().includes('form')) {
    uiDesign.push('Form design with validation feedback and progress indicators');
  }

  const codingStandards = [
    'TypeScript for type safety and better developer experience',
    'ESLint and Prettier for code formatting and quality enforcement',
    'Component documentation with JSDoc comments',
    'Git commit conventions following conventional commits standard',
    'Code review process with pull request templates'
  ];

  if (input.projectType !== 'Frontend') {
    codingStandards.push('API documentation using OpenAPI/Swagger specifications');
    codingStandards.push('Database migration scripts for schema versioning');
  }

  return {
    systemArchitecture,
    databaseSchema,
    apiEndpoints,
    uiDesign,
    codingStandards
  };
};

const generateTasks = (input: ProjectInput): {
  frontend: Task[];
  backend: Task[];
  integration: Task[];
  deployment: Task[];
} => {
  const frontend: Task[] = [];
  const backend: Task[] = [];
  const integration: Task[] = [];
  const deployment: Task[] = [];

  // Frontend Tasks
  if (input.projectType === 'Frontend' || input.projectType === 'Full Stack') {
    frontend.push(
      {
        id: generateUniqueId(),
        title: 'Set up Next.js project with TypeScript',
        description: 'Initialize Next.js application with TypeScript configuration, ESLint, and Prettier',
        complexity: 'Simple',
        estimatedHours: 2,
        dependencies: [],
        category: 'setup',
        completed: false
      },
      {
        id: generateUniqueId(),
        title: 'Configure Tailwind CSS and UI component library',
        description: 'Set up Tailwind CSS with custom configuration and integrate shadcn/ui components',
        complexity: 'Simple',
        estimatedHours: 3,
        dependencies: ['Set up Next.js project'],
        category: 'styling',
        completed: false
      },
      {
        id: generateUniqueId(),
        title: 'Create responsive layout and navigation',
        description: 'Build main layout components with responsive navigation, header, and footer',
        complexity: 'Medium',
        estimatedHours: 8,
        dependencies: ['Configure Tailwind CSS'],
        category: 'layout',
        completed: false
      },
      {
        id: generateUniqueId(),
        title: 'Implement authentication UI',
        description: 'Create login, registration, and user profile components with form validation',
        complexity: 'Medium',
        estimatedHours: 12,
        dependencies: ['Create responsive layout'],
        category: 'auth',
        completed: false
      }
    );

    // Add project-specific frontend tasks based on description
    if (input.description.toLowerCase().includes('dashboard')) {
      frontend.push({
        id: generateUniqueId(),
        title: 'Build admin dashboard interface',
        description: 'Create dashboard layout with sidebar, charts, and data tables for administrative functions',
        complexity: 'Complex',
        estimatedHours: 16,
        dependencies: ['Implement authentication UI'],
        category: 'dashboard',
        completed: false
      });
    }

    if (input.description.toLowerCase().includes('form')) {
      frontend.push({
        id: generateUniqueId(),
        title: 'Create dynamic form components',
        description: 'Build reusable form components with validation, file uploads, and multi-step functionality',
        complexity: 'Medium',
        estimatedHours: 10,
        dependencies: ['Create responsive layout'],
        category: 'forms',
        completed: false
      });
    }

    if (input.description.toLowerCase().includes('search')) {
      frontend.push({
        id: generateUniqueId(),
        title: 'Implement search and filtering interface',
        description: 'Create search bar with autocomplete, filters, and result pagination',
        complexity: 'Medium',
        estimatedHours: 8,
        dependencies: ['Create responsive layout'],
        category: 'search',
        completed: false
      });
    }
  }

  // Backend Tasks
  if (input.projectType === 'Backend' || input.projectType === 'Full Stack') {
    backend.push(
      {
        id: generateUniqueId(),
        title: 'Set up Node.js API server with Express',
        description: 'Initialize Express server with middleware, error handling, and request validation',
        complexity: 'Simple',
        estimatedHours: 4,
        dependencies: [],
        category: 'setup',
        completed: false
      },
      {
        id: generateUniqueId(),
        title: 'Configure database connection and ORM',
        description: 'Set up PostgreSQL connection with Prisma ORM and create initial database schema',
        complexity: 'Medium',
        estimatedHours: 6,
        dependencies: ['Set up Node.js API server'],
        category: 'database',
        completed: false
      },
      {
        id: generateUniqueId(),
        title: 'Implement authentication system',
        description: 'Create JWT-based authentication with password hashing, session management, and middleware',
        complexity: 'Complex',
        estimatedHours: 12,
        dependencies: ['Configure database connection'],
        category: 'auth',
        completed: false
      },
      {
        id: generateUniqueId(),
        title: 'Build CRUD API endpoints',
        description: 'Create RESTful API endpoints for core entities with validation and error handling',
        complexity: 'Medium',
        estimatedHours: 10,
        dependencies: ['Implement authentication system'],
        category: 'api',
        completed: false
      }
    );

    // Add specific backend tasks based on description
    if (input.description.toLowerCase().includes('payment')) {
      backend.push({
        id: generateUniqueId(),
        title: 'Integrate payment processing',
        description: 'Implement Stripe integration with webhook handling for secure payment processing',
        complexity: 'Complex',
        estimatedHours: 14,
        dependencies: ['Build CRUD API endpoints'],
        category: 'payment',
        completed: false
      });
    }

    if (input.description.toLowerCase().includes('email')) {
      backend.push({
        id: generateUniqueId(),
        title: 'Set up email notification system',
        description: 'Configure email service with templates for user notifications and system alerts',
        complexity: 'Medium',
        estimatedHours: 6,
        dependencies: ['Implement authentication system'],
        category: 'notifications',
        completed: false
      });
    }

    if (input.description.toLowerCase().includes('upload') || input.description.toLowerCase().includes('file')) {
      backend.push({
        id: generateUniqueId(),
        title: 'Implement file upload system',
        description: 'Create secure file upload endpoints with validation, storage, and CDN integration',
        complexity: 'Medium',
        estimatedHours: 8,
        dependencies: ['Build CRUD API endpoints'],
        category: 'files',
        completed: false
      });
    }
  }

  // Integration & Testing Tasks
  integration.push(
    {
      id: generateUniqueId(),
      title: 'Set up automated testing framework',
      description: 'Configure Jest and React Testing Library with unit and integration test examples',
      complexity: 'Medium',
      estimatedHours: 6,
      dependencies: [],
      category: 'testing',
      completed: false
    },
    {
      id: generateUniqueId(),
      title: 'Implement error handling and logging',
      description: 'Set up comprehensive error handling with logging service and user-friendly error pages',
      complexity: 'Medium',
      estimatedHours: 8,
      dependencies: [],
      category: 'monitoring',
      completed: false
    }
  );

  if (input.projectType === 'Full Stack') {
    integration.push(
      {
        id: generateUniqueId(),
        title: 'Connect frontend to backend APIs',
        description: 'Integrate frontend components with backend endpoints and implement error handling',
        complexity: 'Medium',
        estimatedHours: 10,
        dependencies: ['Build CRUD API endpoints', 'Implement authentication UI'],
        category: 'integration',
        completed: false
      },
      {
        id: generateUniqueId(),
        title: 'End-to-end testing setup',
        description: 'Configure Playwright or Cypress for automated E2E testing of critical user flows',
        complexity: 'Complex',
        estimatedHours: 12,
        dependencies: ['Connect frontend to backend APIs'],
        category: 'e2e-testing',
        completed: false
      }
    );
  }

  // Deployment & DevOps Tasks
  deployment.push(
    {
      id: generateUniqueId(),
      title: 'Set up CI/CD pipeline',
      description: 'Configure GitHub Actions for automated testing, building, and deployment',
      complexity: 'Medium',
      estimatedHours: 6,
      dependencies: [],
      category: 'cicd',
      completed: false
    },
    {
      id: generateUniqueId(),
      title: 'Configure production environment',
      description: 'Set up production hosting on Vercel/Netlify with environment variables and domain configuration',
      complexity: 'Medium',
      estimatedHours: 4,
      dependencies: ['Set up CI/CD pipeline'],
      category: 'hosting',
      completed: false
    },
    {
      id: generateUniqueId(),
      title: 'Implement monitoring and analytics',
      description: 'Set up application monitoring, performance tracking, and user analytics',
      complexity: 'Simple',
      estimatedHours: 4,
      dependencies: ['Configure production environment'],
      category: 'monitoring',
      completed: false
    },
    {
      id: generateUniqueId(),
      title: 'Security audit and optimization',
      description: 'Conduct security review, implement security headers, and optimize performance',
      complexity: 'Medium',
      estimatedHours: 8,
      dependencies: ['Configure production environment'],
      category: 'security',
      completed: false
    }
  );

  if (input.projectType === 'Backend' || input.projectType === 'Full Stack') {
    deployment.push({
      id: generateUniqueId(),
      title: 'Database backup and migration strategy',
      description: 'Set up automated database backups and create migration deployment strategy',
      complexity: 'Medium',
      estimatedHours: 6,
      dependencies: ['Configure production environment'],
      category: 'database-ops',
      completed: false
    });
  }

  return { frontend, backend, integration, deployment };
};

export const generateProjectPlan = (input: ProjectInput): ProjectPlan => {
  // Merge user's tech stack with suggestions
  const suggestedTech = suggestTechStack(input.projectType, input.description);
  const finalTechStack = input.techStack.length > 0
    ? Array.from(new Set([...input.techStack, ...suggestedTech]))
    : suggestedTech;

  const overview = {
    title: input.title,
    description: input.description,
    projectType: input.projectType,
    techStack: finalTechStack,
    timeline: input.timeline || 'To be determined during planning phase'
  };

  const planningPhase = generatePlanningPhase(input);
  // Derive structured timeline breakdown from task estimates (fallback when AI not used)
  const sumHours = (arr: any[]) => arr.reduce((s, t) => s + (t.estimatedHours || 0), 0);
  const tasksTemp = generateTasks(input);
  const fh = sumHours(tasksTemp.frontend);
  const bh = sumHours(tasksTemp.backend);
  const ih = sumHours(tasksTemp.integration);
  const dh = sumHours(tasksTemp.deployment);
  const hoursToWeeks = (hrs: number) => Math.ceil(hrs / (6 * 5)); // 6 productive hrs * 5 days per week
  const fmtWeeks = (w: number) => `${w} week${w === 1 ? '' : 's'}`;
  const deploymentLine = dh < 8 ? `${dh || 4} hour${(dh || 4) === 1 ? '' : 's'}` : fmtWeeks(hoursToWeeks(dh));
  planningPhase.timeline = [
    `Frontend: ${fmtWeeks(Math.max(1, hoursToWeeks(fh)))}`,
    `Backend: ${fmtWeeks(Math.max(1, hoursToWeeks(bh)))}`,
    `Integration: ${fmtWeeks(Math.max(1, hoursToWeeks(ih)))}`,
    `Deployment: ${deploymentLine}`
  ].join('\n');

  const waterfallPhases = {
    planning: planningPhase,
    analysis: generateAnalysisPhase(input),
    design: generateDesignPhase(input)
  };

  const tasks = tasksTemp;

  return {
    overview,
    tasks,
    waterfallPhases
  };
};