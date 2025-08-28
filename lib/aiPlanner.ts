import { ProjectInput, ProjectPlan, Task } from '@/types/project';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Model name from env or sensible default
const MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

// Lightweight heuristic budget tier classifier to guide the model (string may be free‑form)
function deriveBudgetTier(budget: string | undefined): {
  tier: 'micro' | 'low' | 'mid' | 'standard' | 'enterprise';
  label: string;
} {
  if (!budget) return { tier: 'standard', label: 'Standard (assume ~$10K-$25K)' };
  const b = budget.toLowerCase();
  // Numeric extraction
  const numMatch = b.match(/\$?\s*(\d+[,.]?\d*)\s*k?/);
  let amount = 0;
  if (numMatch) {
    const raw = numMatch[1].replace(/,/g, '');
    amount = parseFloat(raw);
    if (/k/.test(b)) amount *= 1000;
  }
  if (b.includes('25') && b.includes('+')) return { tier: 'enterprise', label: budget };
  if (amount === 0 || /(^|\b)(0|zero)/.test(b) || b.includes('$0')) return { tier: 'micro', label: budget };
  if (b.includes('under') && b.includes('1k')) return { tier: 'micro', label: budget };
  if (amount > 0 && amount < 1000) return { tier: 'micro', label: budget };
  if (amount >= 1000 && amount < 5000) return { tier: 'low', label: budget };
  if (amount >= 5000 && amount < 10000) return { tier: 'mid', label: budget };
  if (amount >= 10000 && amount < 25000) return { tier: 'standard', label: budget };
  if (amount >= 25000) return { tier: 'enterprise', label: budget };
  // Fallback textual clues
  if (b.includes('enterprise') || b.includes('25k')) return { tier: 'enterprise', label: budget };
  if (b.includes('mid')) return { tier: 'mid', label: budget };
  if (b.includes('low')) return { tier: 'low', label: budget };
  return { tier: 'standard', label: budget };
}

function buildPrompt(input: ProjectInput) {
  const budgetInfo = deriveBudgetTier(input.budget);
  console.log("Budget Info: ", budgetInfo)
  const smallProject = (input.projectType === 'Frontend') && (budgetInfo.tier === 'micro' || budgetInfo.tier === 'low');
  /**
   * We purposely keep the structure identical to existing TS interfaces to avoid runtime parse breaks.
   * Prompt now simplified: less prescriptive numeric guidance; rely on LLM judgment with raw context.
   */
  return `You are a senior software delivery program manager & enterprise architect.
Produce a PROFESSIONAL WATERFALL PROJECT PLAN as STRICT JSON ONLY (no markdown/backticks) matching:
interface ProjectPlan { overview:{ title:string; description:string; projectType:string; techStack:string[]; timeline:string }; tasks:{ frontend:Task[]; backend:Task[]; integration:Task[]; deployment:Task[] }; waterfallPhases:{ planning:{ scope:string[]; objectives:string[]; stakeholders:string[]; timeline:string; resources:string[]; risks:string[] }; analysis:{ functionalRequirements:string[]; nonFunctionalRequirements:string[]; userStories:string[]; constraints:string[]; integrations:string[] }; design:{ systemArchitecture:string[]; databaseSchema:string[]; apiEndpoints:string[]; uiDesign:string[]; codingStandards:string[] } } }
interface Task { id:string; title:string; description:string; complexity:'Simple'|'Medium'|'Complex'; estimatedHours:number; dependencies:string[]; category:string; completed:boolean }

KEY PRINCIPLES (lightweight – rely on judgment, avoid arbitrary inflation):
1. JSON ONLY. No text outside JSON.
2. Task ids sequential: t1, t2, ... (unique across all categories). Dependencies only point to earlier ids (acyclic, keep concise & relevant).
3. Provide realistic, implementation-level tasks: break large efforts into clearly deliverable units but avoid noisy micro-tasks (<0.25h). Setup tasks that modern tooling automates should use fractional hours like 0.25 or 0.5 if they truly take minutes.
4. Hours must reflect experienced engineer effort (not padded). If something would exceed ~1 engineer-day (~6 productive hours) consider splitting unless it's inherently cohesive. Cap any single task at a reasonable size; prefer a few coherent follow-on tasks rather than one giant item.
5. Complexity is qualitative: Simple (small change or straightforward component), Medium (multi-step feature slice), Complex (cross-cutting or multi-component coordination). Keep consistent with described hours.
6. Titles action-oriented & specific. Descriptions: one concise business/technical rationale sentence.
7. Keep techStack realistic (merge given + inferred) 6–14 items.
8. Overview.timeline MUST respect user's preferred timeline (can't exceed). If timeline preference implies extreme constraint, reduce/merge scope while keeping a coherent MVP.
9. planning.timeline MUST be exactly 4 lines (Frontend/Backend/Integration/Deployment) each with an integer weeks value OR for Deployment hours if very small (<1 day). Lines separated by single newlines, no extra commentary.
10. Waterfall phase arrays: professional, concrete bullet strings (6–16 words). databaseSchema: one string per entity using pattern "Entity table: field1, field2 (Note), field3". apiEndpoints: "METHOD /path - short description".
11. Use [] where legitimately empty. No null/undefined. No trailing commas. Must parse strictly.
12. Category meaning: frontend=UI & client; backend=services/domain/data; integration=testing, cross-cutting quality, performance, security; deployment=infra/CI/CD/monitoring/release.
13. Complex tasks should list enabling dependencies (at least one) unless genuinely foundational.
14. If project qualifies as small frontend only (flag below true) you may set integration & deployment task arrays to [] and set corresponding planning timeline lines to 0.

RAW CONTEXT (do not over-engineer – use as grounding, not rigid math):
projectTitle: ${input.title}
projectType: ${input.projectType}
description: ${input.description}
targetUsers: ${input.targetUsers}
timelinePreferenceRaw: ${input.timeline || 'N/A'}
budgetRaw: ${input.budget || 'N/A'}
specificRequirements: ${input.specificRequirements || 'None'}
userProvidedTechStack: ${input.techStack.join(', ') || 'None'}
budgetTierHeuristic: ${budgetInfo.tier}
smallFrontendOnlyFlag: ${smallProject ? 'true' : 'false'}

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

// Map of allowed section keys to a descriptor of expected structure
const SECTION_SHAPES: Record<string, { type: 'tasks' | 'stringArray' }> = {
  'tasks.frontend': { type: 'tasks' },
  'tasks.backend': { type: 'tasks' },
  'tasks.integration': { type: 'tasks' },
  'tasks.deployment': { type: 'tasks' },
  'waterfallPhases.design.databaseSchema': { type: 'stringArray' },
  'waterfallPhases.design.apiEndpoints': { type: 'stringArray' },
  'waterfallPhases.design.systemArchitecture': { type: 'stringArray' },
  'waterfallPhases.design.uiDesign': { type: 'stringArray' },
  'waterfallPhases.design.codingStandards': { type: 'stringArray' },
  'waterfallPhases.analysis.functionalRequirements': { type: 'stringArray' },
  'waterfallPhases.analysis.nonFunctionalRequirements': { type: 'stringArray' },
  'waterfallPhases.analysis.userStories': { type: 'stringArray' },
  'waterfallPhases.analysis.constraints': { type: 'stringArray' },
  'waterfallPhases.analysis.integrations': { type: 'stringArray' },
  'waterfallPhases.planning.scope': { type: 'stringArray' },
  'waterfallPhases.planning.objectives': { type: 'stringArray' },
  'waterfallPhases.planning.stakeholders': { type: 'stringArray' },
  'waterfallPhases.planning.resources': { type: 'stringArray' },
  'waterfallPhases.planning.risks': { type: 'stringArray' }
};

export async function refinePlanSectionWithGemini(plan: ProjectPlan, section: string, instruction: string): Promise<any> {
  if (!process.env.GEMINI_API_KEY) throw new Error('Missing GEMINI_API_KEY');
  if (!SECTION_SHAPES[section]) throw new Error('Unsupported section');

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({
    model: MODEL,
    generationConfig: { temperature: 0.6, maxOutputTokens: 16000 }
  });

  const shape = SECTION_SHAPES[section];
  const planJson = JSON.stringify(plan);
  const prompt = `You will refine ONLY the specified section of a software project plan. Return STRICT JSON ONLY.
Section key: ${section}
Instruction: ${instruction || 'Improve quality'}
Full current plan JSON for context (do not echo entirely, only use to understand context): ${planJson}

Return format examples (NO markdown):
{"section":"tasks.backend","value":[{"id":"t10","title":"...","description":"...","complexity":"Medium","estimatedHours":8,"dependencies":["t3"],"category":"backend","completed":false}]} for tasks arrays.
{"section":"waterfallPhases.design.databaseSchema","value":["Entity: fields ...","Another entity ..."]} for string array sections.

Rules:
1. Preserve existing valid task ids; append new ids sequentially continuing the highest number if adding tasks.
2. If removing tasks, ensure dependencies referencing removed ids are updated or removed.
3. For tasks: maintain constraints from original generation rules (complexity ↔ hours). Use same category field.
4. For string arrays: produce high-quality concise professional bullet strings (6-18 words each). No numbering.
5. JSON must have exactly keys: section, value.
6. Do NOT modify unrelated sections.
7. value must not be empty unless instruction explicitly requests clearing.
Begin.`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  try {
    const jsonStart = text.indexOf('{');
    const jsonEnd = text.lastIndexOf('}');
    const parsed = JSON.parse(text.slice(jsonStart, jsonEnd + 1));
    if (parsed.section !== section) throw new Error('Section mismatch in AI response');
    if (shape.type === 'tasks') {
      if (!Array.isArray(parsed.value)) throw new Error('Tasks value must be array');
      parsed.value.forEach((t: Task) => { if (typeof t.completed !== 'boolean') t.completed = false; });
    } else if (shape.type === 'stringArray') {
      if (!Array.isArray(parsed.value)) throw new Error('Section value must be array');
      parsed.value = parsed.value.map((v: any) => String(v));
    }
    return parsed.value;
  } catch (e) {
    console.error('Failed to parse section refine output', e, text);
    throw new Error('Gemini section refine parse error');
  }
}