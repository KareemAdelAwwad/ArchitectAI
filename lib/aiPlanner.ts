import { ProjectInput, ProjectPlan, Task } from '@/types/project';
import OpenAI from 'openai';

// Default model name
const AI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o';

// Lightweight heuristic budget tier classifier to guide the model (string may be free‑form)
function deriveBudgetTier(budget: string | undefined): {
  tier: 'micro' | 'low' | 'mid' | 'standard' | 'enterprise';
  label: string;
} {
  if (!budget) return { tier: 'standard', label: 'Standard (assume ~$10K-$25K)' };
  const b = budget.toLowerCase();
  // Explicit unlimited / very large descriptors
  if (/(unlimited|infinite|no\s*limit|blank\s*check)/.test(b)) return { tier: 'enterprise', label: budget };
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
   * Enhanced prompt: more prescriptive + enterprise scaling guidance while keeping same JSON schema.
   */
  const enterpriseExtras = budgetInfo.tier === 'enterprise' ? `\nENTERPRISE / LARGE-SCALE AUGMENTATIONS:\n- Treat scope as a potentially multi-year, multi-team program (example: large ecommerce platform / Amazon-like).\n- Still constrain JSON to given schema; express breadth through: more tasks (ensure still concise), richer architecture bullets, broader databaseSchema & apiEndpoints coverage.\n- Target task count guidance (not hard requirement):\n  * frontend: 25-80 tasks covering customer web, admin console, accessibility, performance.\n  * backend: 40-120 tasks covering domain microservices, data pipelines, search, payments, inventory, notifications.\n  * integration: 20-60 tasks for QA strategy, performance/load, chaos testing, security, compliance (PCI, GDPR), observability, resilience drills.\n  * deployment: 15-40 tasks for multi-region infra as code, CI/CD, blue/green, canary, auto-scaling, disaster recovery (RPO/RTO), cost governance.\n- Encourage parallelization: dependencies represent critical sequencing only (avoid serial chains >5).\n- Favor service-oriented / event-driven design; highlight domain boundaries in systemArchitecture.\n- databaseSchema should include core domains (Users, Products, Inventory, Orders, Payments, Carts, Shipments, Reviews, Notifications, Analytics, Audit) as separate lines.\n- apiEndpoints should cover representative CRUD + critical workflows (cart ops, checkout, payment webhook, inventory reservation, order lifecycle, search, user auth/session, review submission).\n- Include security & compliance considerations (encryption, PII minimization, tokenization for payments) within appropriate phases/tasks.\n- For extremely large scope DO NOT explode into thousands of tasks; provide a pragmatic initial tranche enabling a first large-scale release (foundational platform) not infinite backlog.\n` : '';

  return `You are a senior program manager & enterprise software architect generating a PROFESSIONAL WATERFALL PROJECT PLAN. Output STRICT JSON ONLY (no markdown/backticks) matching EXACTLY:
interface ProjectPlan { overview:{ title:string; description:string; projectType:string; techStack:string[]; timeline:string }; tasks:{ frontend:Task[]; backend:Task[]; integration:Task[]; deployment:Task[] }; waterfallPhases:{ planning:{ scope:string[]; objectives:string[]; stakeholders:string[]; timeline:string; resources:string[]; risks:string[] }; analysis:{ functionalRequirements:string[]; nonFunctionalRequirements:string[]; userStories:string[]; constraints:string[]; integrations:string[] }; design:{ systemArchitecture:string[]; databaseSchema:string[]; apiEndpoints:string[]; uiDesign:string[]; codingStandards:string[] } } }
interface Task { id:string; title:string; description:string; complexity:'Simple'|'Medium'|'Complex'; estimatedHours:number; dependencies:string[]; category:string; completed:boolean }

GLOBAL RULES:
1. JSON ONLY. Nothing before or after the single object.
2. Task id sequence: t1, t2, ... unique across ALL categories (global ordering). Dependencies reference only prior ids (acyclic, minimal necessary edges). Avoid long serial dependency chains.
3. Appropriate granularity: Each task delivers a reviewable increment. Typical hours: Simple 0.25–3h, Medium 3–8h, Complex 8–16h (rarely up to 20h if cohesive). Split anything exceeding ~16h unless atomic (e.g., complex migration). No task > 24h.
4. Complexity aligns with scope & hours. Complex tasks usually integrate multiple subsystems and declare at least one dependency unless foundational.
5. Titles start with a domain or layer prefix when helpful (e.g., "Cart - Implement reservation workflow"). Description: concise outcome + value (<= 22 words).
6. Keep tasks free of meta management (no "Write project plan", no standups). Include security, performance, resilience, compliance engineering tasks explicitly.
7. Tech stack: Merge provided + inferred; include frameworks, infra, data, messaging, auth, monitoring. 6–14 items (enterprise may reach upper bound but not exceed 14 to stay focused).
8. Overview.timeline cannot exceed user preference; if user timeline is unrealistically short for scope, narrate compression by focusing on MVP enabling core value flows (cart→checkout→order→fulfillment for commerce) while deferring advanced features implicitly (not listed).
9. planning.timeline EXACTLY 4 lines in order (Frontend, Backend, Integration, Deployment) each: "Label: <int> weeks" (or for Deployment if <1 week, you may use hours like "Deployment: 6 hours"). Each on its own line, no extra lines.
10. Waterfall phase arrays: professional, concrete, active voice 6–18 words each. Avoid vague filler (no "Do analysis").
11. databaseSchema: one string per entity pattern "Entity table: field1, field2 (Note), field3" focusing on principal fields only (no exhaustive enumeration). Keep 8–20 entities (fewer for small projects).
12. apiEndpoints: representative, not every possible variant. Format "METHOD /path - brief purpose". 12–40 endpoints depending on scope.
13. uiDesign: per major UI surface or component cluster (e.g., "Product listing grid with adaptive filtering & skeleton states").
14. codingStandards: items mixing conventions (naming, error handling), quality gates, security baseline (e.g., "Centralized input validation & sanitization layer").
15. Use [] only when truly empty (e.g., integration/deployment omitted for micro frontend prototype). Never use null/undefined. No trailing commas.
16. Avoid speculative futuristic tech; prioritize proven, scalable choices consistent with project type & scale tier.
17. Dependencies: Only list IDs that materially gate execution (avoid noise). If parallelizable, omit dependency.
18. If smallFrontendOnlyFlag=true: integration & deployment tasks must both be [] and planning timeline lines for those categories must be 0 weeks.
19. Provide a balanced distribution: backend usually >= frontend for non-trivial multi-domain systems.
20. Risk items are specific ("Payment provider latency spikes impacting checkout throughput"), not generic.
21. Do NOT invent extra top-level properties; schema must remain exactly as defined.
${enterpriseExtras}GENERATIVE CALIBRATION:
- Favor pragmatic MVP enabling core user journeys first even for large scope; tasks should reflect foundations + primary workflows.
- Reflect non-functional requirements (performance, scalability, observability, security, compliance) across analysis, design & integration tasks (not solely one bucket).

RAW CONTEXT (reference; do not copy verbatim unless needed):
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

export async function generatePlan(input: ProjectInput): Promise<ProjectPlan> {
  console.log('[AI Planner] Starting generation', { title: input.title, model: AI_MODEL });
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('Missing OPENAI_API_KEY');
  }

  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_BASE_URL,
  });

  const prompt = buildPrompt(input);
  const maxRetries = 3;
  let attempt = 0;
  let lastErr: any;
  let text = '';

  while (attempt < maxRetries) {
    try {
      attempt++;
      if (attempt > 1) console.log(`[AI Planner] Retry attempt ${attempt}`);
      const result = await client.chat.completions.create({
        model: AI_MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature: 1.0,
      });
      console.log('[AI Planner] Raw response received');
      text = result.choices[0]?.message?.content || '';
      break; // success
    } catch (e: any) {
      lastErr = e;
      const status = e?.status || e?.response?.status;
      const retriable = status >= 500 || status === 429 || !status; // network/internal/ratelimit
      console.warn('[AI Planner] Attempt failed', { attempt, status, retriable });
      if (!retriable || attempt >= maxRetries) {
        console.error('[AI Planner] Giving up after attempts', attempt);
        throw e; // propagate
      }
      const backoffMs = 500 * Math.pow(2, attempt - 1) + Math.floor(Math.random() * 250);
      await new Promise(r => setTimeout(r, backoffMs));
    }
  }

  try {
    const jsonStart = text.indexOf('{');
    const jsonEnd = text.lastIndexOf('}');
    const json = JSON.parse(text.slice(jsonStart, jsonEnd + 1));
    // Basic normalization: ensure completed present and phase arrays are arrays
    const addCompleted = (tasks: Task[]) => tasks.forEach(t => { if (typeof t.completed !== 'boolean') t.completed = false; });
    if (json.tasks) {
      if (json.tasks.frontend) addCompleted(json.tasks.frontend);
      if (json.tasks.backend) addCompleted(json.tasks.backend);
      if (json.tasks.integration) addCompleted(json.tasks.integration);
      if (json.tasks.deployment) addCompleted(json.tasks.deployment);
    }

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
    (json as any)._source = 'openai-proxy';
    return json as ProjectPlan;
  } catch (e) {
    console.error('Failed to parse AI output', e, text);
    throw new Error('AI output parse error');
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

export async function refinePlanSection(plan: ProjectPlan, section: string, instruction: string): Promise<any> {
  if (!process.env.OPENAI_API_KEY) throw new Error('Missing OPENAI_API_KEY');
  if (!SECTION_SHAPES[section]) throw new Error('Unsupported section');

  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_BASE_URL,
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

  const result = await client.chat.completions.create({
    model: AI_MODEL,
    temperature: 1.0,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = result.choices[0]?.message?.content || '';
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
    throw new Error('AI section refine parse error');
  }
}