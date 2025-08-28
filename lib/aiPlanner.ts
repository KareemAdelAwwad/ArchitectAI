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
4. Task volume MUST scale with budget tier (avoid overkill for tiny budgets, stay realistic for larger). Budget tier derived: ${budgetInfo.tier} (${budgetInfo.label}). Use these guidance ranges (can be slightly adjusted for domain fit). If SMALL FRONTEND-ONLY (criteria: projectType=Frontend AND budget tier micro/low) you MUST drastically simplify and MAY omit entire integration & deployment categories (set them to []):
  - Full Stack: micro 20–30, low 30–40, mid 45–55, standard 60–75, enterprise 75–110 tasks total.
  - Frontend OR Backend only: micro 12–18, low 18–25, mid 26–34, standard 35–45, enterprise 46–65 tasks.
  Provide COMPREHENSIVE but NON-TRIVIAL tasks; if budget is micro/low MERGE or OMITS non-essential optimization/refinement tasks while keeping a coherent MVP. NEVER exceed upper bound by more than 5%.
5. Task sizing & realistic hours (CRITICAL):
  a. Complexity ↔ hours calibration (use integer or .5 where needed, never 0):
    - Simple: 0.25–4h (tiny setup / config / small component / minor schema change). NEVER assign more than 4h to a Simple task.
    - Medium: 5–12h (cohesive feature slice, endpoint + validation + basic tests, multi-component UI flow).
    - Complex: 13–32h (multi-step feature requiring coordination or deep design). Anything estimated >32h MUST be decomposed.
    (Legacy bounds 16–40h replaced for tighter realism.)
  b. Break down over-large tasks: No single task may exceed 32h. If an effort >12h can be split into independently deliverable increments, split into multiple tasks each still outcome-focused (avoid excessive micro-tasks <0.25h).
  c. Avoid generic buckets (e.g., "Implement backend services", "Set up entire UI"). Replace with specific deliverables (e.g., "Implement user session persistence service").
  d. Scaffold / automation tasks must reflect modern tooling speed. Examples realistic upper bounds:
    - "Setup Next.js project with TypeScript and Tailwind" <= 0.5h (often 0.25h)
    - Add ESLint + Prettier config 0.5–1h
    - Basic CI pipeline (lint + test) 1–2h
    - Single CRUD endpoint (handler + validation + basic tests) 2–4h (Medium)
    - Auth flow (JWT/session issuance + refresh logic) 6–10h (Medium/Complex depending on scope)
    - Payment integration (stripe basic checkout) 8–14h (Complex if webhooks + retries)
  e. Distribution target AFTER decomposition: 50–60% Simple, 30–40% Medium, 10–15% Complex. If project is tiny (micro tier) you may have 0–2 Complex tasks total.
  f. Do NOT inflate hours for familiarity tasks; reflect realistic experienced engineer pace.
6. Titles: action-oriented, specific (e.g., "Implement role-based auth middleware" not "Auth").
7. Descriptions: 1 concise sentence (<= 180 chars) describing purpose & business/technical rationale. Avoid line breaks.
8. Tech stack: merge provided stack + inferred realistic stack; dedupe; 6–14 items.
9. Timeline CONSTRAINT: Preferred timeline provided by user MUST be respected (user: "${input.timeline || 'N/A'}"). OVERVIEW.timeline must NOT exceed preferred timeline upper bound (if a single number, treat as max). If raw estimates would exceed, you MUST reduce scope (merge or simplify tasks) so total estimated hours fit within preferred time using assumption: 6 productive dev hours * 5 days/week * team size (default 4 engineers unless budget tier reduces team: micro=1 dev, low=2, mid=3, standard=4, enterprise=5). Express overview.timeline as a realistic range not exceeding preferred. If preferred timeline is empty, compute normally.
  Also produce planning.timeline (inside planning phase) as a MULTI-LINE CATEGORY BREAKDOWN with EXACTLY these 4 lines in this order and tab or single space after colon (numbers MAY be 0 where no work is required):
Frontend: <number> week(s)
Backend: <number> week(s)
Integration: <number> week(s)
Deployment: <number> (week(s)|hour(s))
Rules for planning.timeline lines:
 - Use plural weeks if value > 1 else singular week. For hours use 'hours' plural unless exactly 1.
 - Deployment may be hours if under 8 hours total, otherwise convert to weeks (round up partial weeks to nearest half week e.g., 1.5 weeks).
 - Numbers must be integers for weeks, integers for hours.
 - No extra commentary; ONLY those four lines separated by a single newline.
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
  - design.databaseSchema: ONE STRING PER ENTITY using pattern "<EntityName> table: field1, field2 (Note), field3". Notes in parentheses become field badges (keep concise like JSONB, enum, FK). No SQL DDL, just entity and comma-separated fields with optional (Note). Example: "Users table: id, tenantId (FK), email, role (enum), createdAt".
  - design.apiEndpoints: ONE STRING PER ENDPOINT using pattern "METHOD /path - short description" (METHOD uppercase: GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD). Example: "GET /courses/:id - fetch course detail". Description after hyphen < 80 chars, action oriented.
   - design.uiDesign: key screen or flow statements
   - design.codingStandards: conventions/tooling (linting, patterns, security)
11. No empty strings. Use [] if legitimately empty (avoid null/undefined).
12. Keep total JSON size reasonable (avoid excessive verbosity) while still enterprise-detailed.
13. Maintain consistent category allocation: UI/UX/client in frontend; domain logic/data/services in backend; cross-cutting QA, performance, security, integration tests in integration; infra, CI/CD, monitoring, scaling, release in deployment.
14. For Complex tasks include dependencies covering enabling tasks; never isolate complex tasks without prerequisites.
15. Ensure no trailing commas; valid strict JSON parseable by JSON.parse.
16. NEVER exceed preferred timeline; adjust task counts/estimatedHours downward if necessary while keeping logical sequence & dependencies valid. It's permitted for any component line to be 0 weeks/hours if truly no work. For small frontend-only projects integration and deployment arrays SHOULD be [] and corresponding planning.timeline lines MUST be 0.
PROJECT SIZE FLAG: smallFrontendOnly=${smallProject ? 'true' : 'false'} (used to decide omission of integration & deployment categories when true).
17. When shrinking for micro/low budgets, prefer reducing optional optimization, extensive testing layers, and non-critical advanced monitoring before core functional tasks.
18. If preferred timeline is 0 (or expresses zero), produce the absolute minimal viable set of tasks and set overview.timeline to "0 weeks" (or "0–0 weeks") with tasks having very small hours (still >0) and planning lines possibly containing 0 values.

PROJECT INPUT CONTEXT:
Title: ${input.title}
Type: ${input.projectType}
Description: ${input.description}
Target Users: ${input.targetUsers}
Timeline Preference: ${input.timeline}
Budget: ${input.budget}
Specific Requirements: ${input.specificRequirements}
User Provided Tech Stack: ${input.techStack.join(', ') || 'None'}
 Derived Budget Tier: ${budgetInfo.tier}

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