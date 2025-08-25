import { ProjectInput, ProjectPlan, Task } from '@/types/project';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Model name from env or sensible default
const MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

function buildPrompt(input: ProjectInput) {
  /**
   * We purposely keep the structure identical to existing TS interfaces to avoid runtime parse breaks.
   * We enrich instructions for deeper, professional, real‑world Waterfall content while keeping JSON lean.
   */
  return `You are a senior software delivery program manager + enterprise architect.
Create a PROFESSIONAL, REAL-WORLD GRADE WATERFALL PLAN as STRICT JSON ONLY (no markdown, no backticks) matching:
interface ProjectPlan { overview: { title: string; description: string; projectType: string; techStack: string[]; timeline: string; }; tasks: { frontend: Task[]; backend: Task[]; integration: Task[]; deployment: Task[] }; waterfallPhases: { planning: { scope: string[]; objectives: string[]; stakeholders: string[]; timeline: string; resources: string[]; risks: string[] }; analysis: { functionalRequirements: string[]; nonFunctionalRequirements: string[]; userStories: string[]; constraints: string[]; integrations: string[] }; design: { systemArchitecture: string[]; databaseSchema: string[]; apiEndpoints: string[]; uiDesign: string[]; codingStandards: string[] } } }
interface Task { id: string; title: string; description: string; complexity: 'Simple' | 'Medium' | 'Complex'; estimatedHours: number; dependencies: string[]; category: string; completed: boolean }

OUTPUT RULES (CRITICAL):
1. JSON ONLY. No prose outside JSON. Do not prefix/suffix.
2. Use concise globally-unique task ids: t1, t2, t3 ... sequential with no gaps. All categories share the id sequence.
3. Dependencies: only reference ids that appear EARLIER (acyclic). Keep dependencies array short (<=4) and relevant.
4. Task volume: Provide a COMPREHENSIVE granular breakdown (NO arbitrary cap). Minimum counts: Full Stack >= 60 tasks; Frontend or Backend only >= 35. Only add genuinely valuable decomposition—avoid trivial duplicates.
5. Complexity ↔ hours: Simple <5h, Medium 5–15h, Complex 16–40h (never 0). Distribute roughly: 50–60% Simple, 30–40% Medium, 10–15% Complex (adjust if domain demands more complexity).
6. Titles: action-oriented, specific (e.g., "Implement role-based auth middleware" not "Auth").
7. Descriptions: 1 concise sentence (<= 180 chars) describing purpose & business/technical rationale. Avoid line breaks.
8. Tech stack: merge provided stack + inferred realistic stack; dedupe; 6–14 items.
9. Overview.timeline: realistic high-level range (e.g., "14–18 weeks") consistent with scope & total estimated hours (assume 6 productive dev hours per person per day; small team 4–6 engineers unless constraints imply otherwise).
10. Waterfall phase arrays: Provide richly specific bullet strings (each 6–16 words) capturing professional detail. They MUST be arrays (even if single item). Keep them:
   - planning.scope: major deliverables & boundaries
   - planning.objectives: measurable outcome statements
   - planning.stakeholders: role + interest (e.g., "Product Owner – roadmap alignment")
   - planning.resources: critical tools/people/environment
   - planning.risks: explicit risk + mitigation pattern ("Risk: ... | Mitigation: ...")
   - analysis.functionalRequirements: capability statements starting with a verb
   - analysis.nonFunctionalRequirements: quality attributes with target metric
   - analysis.userStories: standard story format OR persona format
   - analysis.constraints: environmental/organizational/technical constraints
   - analysis.integrations: system/component + purpose
   - design.systemArchitecture: layers/components interactions
   - design.databaseSchema: entities + key fields (no full SQL)
   - design.apiEndpoints: method + path + purpose
   - design.uiDesign: key screen or flow statements
   - design.codingStandards: conventions/tooling (linting, patterns, security)
11. No empty strings. Use [] if legitimately empty (avoid null/undefined).
12. Keep total JSON size reasonable (avoid excessive verbosity) while still enterprise-detailed.
13. Maintain consistent category allocation: UI/UX/client in frontend; domain logic/data/services in backend; cross-cutting QA, performance, security, integration tests in integration; infra, CI/CD, monitoring, scaling, release in deployment.
14. For Complex tasks include dependencies covering enabling tasks; never isolate complex tasks without prerequisites.
15. Ensure no trailing commas; valid strict JSON parseable by JSON.parse.

PROJECT INPUT CONTEXT:
Title: ${input.title}
Type: ${input.projectType}
Description: ${input.description}
Target Users: ${input.targetUsers}
Timeline Preference: ${input.timeline}
Budget: ${input.budget}
Specific Requirements: ${input.specificRequirements}
User Provided Tech Stack: ${input.techStack.join(', ') || 'None'}

Return ONLY the JSON object.`;
}

export async function generatePlanWithGemini(input: ProjectInput): Promise<ProjectPlan> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('Missing GEMINI_API_KEY');
  }
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({
    model: MODEL,
    generationConfig: {
      // Slightly higher temperature for more creative analysis/design while still deterministic enough for JSON
      temperature: 0.55,
      maxOutputTokens: 32000,
    }
  });
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