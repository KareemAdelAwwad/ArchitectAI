import { ProjectInput, ProjectPlan, Task } from '@/types/project';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Model name from env or fallback
const MODEL = process.env.GEMINI_MODEL!;

function buildPrompt(input: ProjectInput) {
  return `You are an expert software delivery project planner. Generate a VERY DETAILED waterfall style plan.
Return STRICT JSON ONLY matching this TypeScript interface (no markdown):
interface ProjectPlan { overview: { title: string; description: string; projectType: string; techStack: string[]; timeline: string; }; tasks: { frontend: Task[]; backend: Task[]; integration: Task[]; deployment: Task[] }; waterfallPhases: { planning: { scope: string[]; objectives: string[]; stakeholders: string[]; timeline: string; resources: string[]; risks: string[] }; analysis: { functionalRequirements: string[]; nonFunctionalRequirements: string[]; userStories: string[]; constraints: string[]; integrations: string[] }; design: { systemArchitecture: string[]; databaseSchema: string[]; apiEndpoints: string[]; uiDesign: string[]; codingStandards: string[] } } }
interface Task { id: string; title: string; description: string; complexity: 'Simple' | 'Medium' | 'Complex'; estimatedHours: number; dependencies: string[]; category: string; completed: boolean }
Rules:
1. Provide 40-120 tasks if project is Full Stack; 25-70 if Frontend or Backend.
2. Distribute tasks logically across categories.
3. Ensure dependencies reference prior task ids (use concise ids like t1,t2,... but unique across all arrays).
4. complexity correlates with estimatedHours (Simple < 5h, Medium 5-15h, Complex 15h+).
5. techStack must be realistic and deduplicated.
6. Do NOT include commentary. JSON only.
7. timeline in overview should be a high-level range (e.g. '12-14 weeks').

Project Input:
Title: ${input.title}
Type: ${input.projectType}
Description: ${input.description}
Target Users: ${input.targetUsers}
Timeline Preference: ${input.timeline}
Budget: ${input.budget}
Specific Requirements: ${input.specificRequirements}
User Provided Tech Stack: ${input.techStack.join(', ') || 'None'}

Generate now.`;
}

export async function generatePlanWithGemini(input: ProjectInput): Promise<ProjectPlan> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('Missing GEMINI_API_KEY');
  }
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: MODEL, generationConfig: { temperature: 0.4, maxOutputTokens: 32000 } });
  const prompt = buildPrompt(input);
  const result = await model.generateContent(prompt);
  const text = result.response.text();
  try {
    const jsonStart = text.indexOf('{');
    const jsonEnd = text.lastIndexOf('}');
    const json = JSON.parse(text.slice(jsonStart, jsonEnd + 1));
    // Basic normalization: ensure completed present and phase arrays are arrays
    const addCompleted = (tasks: Task[]) => tasks.forEach(t => { if (typeof t.completed !== 'boolean') t.completed = false; });
    addCompleted(json.tasks.frontend);
    addCompleted(json.tasks.backend);
    addCompleted(json.tasks.integration);
    addCompleted(json.tasks.deployment);

    const ensureArray = (val: any): string[] => {
      if (Array.isArray(val)) return val.map(String);
      if (val == null) return [];
      if (typeof val === 'string') return val.split(/\n+|;+/).map(s => s.trim()).filter(Boolean);
      if (typeof val === 'object') return Object.values(val).map(v => String(v));
      return [String(val)];
    };

    if (json.waterfallPhases) {
      const { planning, analysis, design } = json.waterfallPhases;
      if (planning) {
        planning.scope = ensureArray(planning.scope);
        planning.objectives = ensureArray(planning.objectives);
        planning.stakeholders = ensureArray(planning.stakeholders);
        planning.resources = ensureArray(planning.resources);
        planning.risks = ensureArray(planning.risks);
        if (typeof planning.timeline !== 'string') planning.timeline = String(planning.timeline || 'To be defined');
      }
      if (analysis) {
        analysis.functionalRequirements = ensureArray(analysis.functionalRequirements);
        analysis.nonFunctionalRequirements = ensureArray(analysis.nonFunctionalRequirements);
        analysis.userStories = ensureArray(analysis.userStories);
        analysis.constraints = ensureArray(analysis.constraints);
        analysis.integrations = ensureArray(analysis.integrations);
      }
      if (design) {
        design.systemArchitecture = ensureArray(design.systemArchitecture);
        design.databaseSchema = ensureArray(design.databaseSchema);
        design.apiEndpoints = ensureArray(design.apiEndpoints);
        design.uiDesign = ensureArray(design.uiDesign);
        design.codingStandards = ensureArray(design.codingStandards);
      }
    }
    return json as ProjectPlan;
  } catch (e) {
    console.error('Failed to parse Gemini output', e, text);
    throw new Error('Gemini output parse error');
  }
}