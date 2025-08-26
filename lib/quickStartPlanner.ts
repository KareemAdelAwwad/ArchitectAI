import { ProjectPlan, QuickStartPhase } from '@/types/project';
import fs from 'fs';
import path from 'path';
// @ts-ignore - OpenAI types may not resolve correctly depending on version
import OpenAI from 'openai';

// Soft timeout (ms) for AI generation so Vercel function can still return a fallback gracefully
const MAX_AI_MS = Number(process.env.QUICKSTART_AI_TIMEOUT_MS || 18000); // keep under hobby 10s hard limit margin

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(label + ' timeout'));
    }, ms);
    promise.then(v => { clearTimeout(timer); resolve(v); }, e => { clearTimeout(timer); reject(e); });
  });
}

// Retain only minimal package manager inference; all other logic-based planning removed per request.
function inferPackageManager(): QuickStartPhase['packageManager'] {
  try {
    const root = process.cwd();
    if (fs.existsSync(path.join(root, 'pnpm-lock.yaml'))) return 'pnpm';
    if (fs.existsSync(path.join(root, 'yarn.lock'))) return 'yarn';
    if (fs.existsSync(path.join(root, 'bun.lockb'))) return 'bun';
    if (fs.existsSync(path.join(root, 'package-lock.json'))) return 'npm';
  } catch { }
  return 'npm';
}

function minimalFallback(plan: ProjectPlan, pm: QuickStartPhase['packageManager']): QuickStartPhase {
  const content = `# COPILOT EDITS OPERATIONAL GUIDELINES

## PRIME DIRECTIVE
\tAvoid working on more than one file at a time.
\tMultiple simultaneous edits to a file will cause corruption.
\tBe chatting and teach about what you are doing while coding.

## LARGE FILE & COMPLEX CHANGE PROTOCOL

### MANDATORY PLANNING PHASE
\tWhen working with large files (>300 lines) or complex changes:
\t\t1. ALWAYS start by creating a detailed plan BEFORE making any edits
            2. Your plan MUST include:
                   - All functions/sections that need modification
                   - The order in which changes should be applied
                   - Dependencies between changes
                   - Estimated number of separate edits required
                
            3. Format your plan as:
## PROPOSED EDIT PLAN
\tWorking with: [filename]
\tTotal planned edits: [number]

### MAKING EDITS
\t- Focus on one conceptual change at a time
\t- Show clear "before" and "after" snippets when proposing changes
\t- Include concise explanations of what changed and why
\t- Always check if the edit maintains the project's coding style

### Edit sequence:
\t1. [First specific change] - Purpose: [why]
\t2. [Second specific change] - Purpose: [why]
\t3. Do you approve this plan? I'll proceed with Edit [number] after your confirmation.
\t4. WAIT for explicit user confirmation before making ANY edits when user ok edit [number]
            
### EXECUTION PHASE
\t- After each individual edit, clearly indicate progress:
\t\t"✅ Completed edit [#] of [total]. Ready for next edit?"
\t- If you discover additional needed changes during editing:
\t- STOP and update the plan
\t- Get approval before continuing
                
### REFACTORING GUIDANCE
\tWhen refactoring large files:
\t- Break work into logical, independently functional chunks
\t- Ensure each intermediate state maintains functionality
\t- Consider temporary duplication as a valid interim step
\t- Always indicate the refactoring pattern being applied
                
### RATE LIMIT AVOIDANCE
\t- For very large files, suggest splitting changes across multiple sessions
\t- Prioritize changes that are logically complete units
\t- Always provide clear stopping points
            
## General Requirements
\tUse modern technologies as described below for all code suggestions. Prioritize clean, maintainable code with appropriate comments.
            
### Accessibility
\t- Ensure compliance with WCAG 2.1 AA level minimum, AAA whenever feasible.
\t- Always suggest:
\t- Labels for form fields.
\t- Proper ARIA roles and attributes.
\t- Adequate color contrast.
\t- Alternative texts (\`alt\`, \`aria-label\`) for media elements.
\t- Semantic HTML for clear structure.
\t- Tools like Lighthouse for audits.
        
## Browser Compatibility
\t- Prioritize feature detection (if ('fetch' in window) etc.).
        - Support latest two stable releases of major browsers:
\t- Firefox, Chrome, Edge, Safari (macOS/iOS)
        - Emphasize progressive enhancement with polyfills or bundlers (e.g., Babel, Vite) as needed.
            
## PHP Requirements
\t- Target Version: PHP 8.1 or higher
\t- Features to Use:
\t- Named arguments
\t- Constructor property promotion
\t- Union types and nullable types
\t- Match expressions
\t- Nullsafe operator (\`?->\`)
\t- Attributes instead of annotations
\t- Typed properties with appropriate type declarations
\t- Return type declarations
\t- Enumerations (enum)
\t- Readonly properties
\t- Emphasize strict property typing in all generated code.
\t- Coding Standards:
\t- Follow PSR-12 coding standards
\t- Use strict typing with declare(strict_types=1);
\t- Prefer composition over inheritance
\t- Use dependency injection
\t- Static Analysis:
\t- Include PHPDoc blocks compatible with PHPStan or Psalm for static analysis
\t- Error Handling:
\t- Use exceptions consistently for error handling and avoid suppressing errors.
\t- Provide meaningful, clear exception messages and proper exception types.
            
## HTML/CSS Requirements
\t- HTML:
\t- Use HTML5 semantic elements (<header>, <nav>, <main>, <section>, <article>, <footer>, <search>, etc.)
\t- Include appropriate ARIA attributes for accessibility
\t- Ensure valid markup that passes W3C validation
\t- Use responsive design practices
\t- Optimize images using modern formats (WebP, AVIF)
\t- Include loading="lazy" on images where applicable
\t- Generate srcset and sizes attributes for responsive images when relevant
\t- Prioritize SEO-friendly elements (<title>, <meta description>, Open Graph tags)
            
\t- CSS:
\t- Use modern CSS features including:
\t- CSS Grid and Flexbox for layouts
\t- CSS Custom Properties (variables)
\t- CSS animations and transitions
\t- Media queries for responsive design
\t- Logical properties (margin-inline, padding-block, etc.)
\t- Modern selectors (:is(), :where(), :has())
\t- Follow BEM or similar methodology for class naming
\t- Use CSS nesting where appropriate
\t- Include dark mode support with prefers-color-scheme
\t- Prioritize modern, performant fonts and variable fonts for smaller file sizes
\t- Use modern units (rem, vh, vw) instead of traditional pixels (px) for better responsiveness
            
## JavaScript Requirements
\t- Minimum Compatibility: ECMAScript 2020 (ES11) or higher
\t- Features to Use:
\t- Arrow functions
\t- Template literals
\t- Destructuring assignment
\t- Spread/rest operators
\t- Async/await for asynchronous code
\t- Classes with proper inheritance when OOP is needed
\t- Object shorthand notation
\t- Optional chaining (?.)
\t- Nullish coalescing (??)
\t- Dynamic imports
\t- BigInt for large integers
\t- Promise.allSettled()
\t- String.prototype.matchAll()
\t- globalThis object
\t- Private class fields and methods
\t- Export * as namespace syntax
\t- Array methods (map, filter, reduce, flatMap, etc.)
\t- Avoid:
\t- var keyword (use const and let)
\t- jQuery or any external libraries
\t- Callback-based asynchronous patterns when promises can be used
\t- Internet Explorer compatibility
\t- Legacy module formats (use ES modules)
\t- Limit use of eval() due to security risks
\t- Performance Considerations:
\t- Recommend code splitting and dynamic imports for lazy loading
\t- Error Handling:
\t- Use try-catch blocks consistently for asynchronous and API calls, and handle promise rejections explicitly.
\t- Differentiate among:
\t- Network errors (e.g., timeouts, server errors, rate-limiting)
\t- Functional/business logic errors (logical missteps, invalid user input, validation failures)
\t- Runtime exceptions (unexpected errors such as null references)
\t- Provide user-friendly error messages and log technical details separately.
\t- Consider a central error handler or global events for reporting.
\t- Carefully handle and validate JSON responses and HTTP status codes.
            
## Folder Structure
\tproject-root/
\t├── api/
\t├── config/
\t├── data/
\t├── public/
\t│   ├── assets/
\t│   │   ├── css/
\t│   │   ├── js/
\t│   │   ├── images/
\t│   │   ├── fonts/
\t│   └── index.html
\t├── src/
\t│   ├── controllers/
\t│   ├── models/
\t│   ├── views/
\t│   └── utilities/
\t├── tests/
\t├── docs/
\t├── logs/
\t├── scripts/
\t└── temp/

## Documentation Requirements
\t- Include JSDoc comments for JavaScript/TypeScript.
\t- Document complex functions with clear examples.
\t- Maintain concise Markdown documentation.
\t- Minimum docblock info: param, return, throws, author
    
## Database Requirements (SQLite 3.46+)
\t- Leverage JSON columns, generated columns, strict mode, foreign keys, check constraints, and transactions.
    
## Security Considerations
\t- Sanitize all user inputs thoroughly.
\t- Parameterize database queries.
\t- Enforce strong Content Security Policies (CSP).
\t- Use CSRF protection where applicable.
\t- Ensure secure cookies (HttpOnly, Secure, SameSite=Strict).
\t- Limit privileges and enforce role-based access control.
\t- Implement detailed internal logging and monitoring.
`;
  return {
    installCommands: [
      `${pm === 'yarn' ? 'yarn add' : pm === 'pnpm' ? 'pnpm add' : pm === 'bun' ? 'bun add' : 'npm install'} next react react-dom`,
      `${pm === 'yarn' ? 'yarn add -D' : pm === 'pnpm' ? 'pnpm add -D' : pm === 'bun' ? 'bun add -d' : 'npm install -D'} typescript eslint prettier`
    ],
    copilotInstructions: {
      filename: 'copilot-instructions.md',
      content
    },
    packageScripts: {
      dev: 'next dev',
      build: 'next build',
      start: 'next start',
      lint: 'next lint'
    },
    envExample: [
      '# Minimal env',
      'NODE_ENV=development',
      'NEXTAUTH_SECRET=changeme',
      'NEXTAUTH_URL=http://localhost:3000'
    ],
    packageManager: pm,
    generatedAt: new Date().toISOString()
  };
}

function extractJsonBlock(text: string): any {
  const REQUIRED_KEYS = ['installCommands', 'copilotInstructions', 'packageScripts', 'envExample', 'packageManager', 'generatedAt'];
  const tryParse = (raw: string) => {
    const cleaned = raw.trim()
      .replace(/^```json/i, '')
      .replace(/^```/, '')
      .replace(/```$/, '')
      .trim();
    if (!cleaned.startsWith('{') || !cleaned.endsWith('}')) throw new Error('Not object');
    const obj = JSON.parse(cleaned);
    if (REQUIRED_KEYS.every(k => k in obj)) return obj;
    // still accept if at least two primary keys exist; fill later
    if (['installCommands', 'copilotInstructions'].some(k => k in obj)) return obj;
    throw new Error('Missing required keys');
  };
  // 1. Code fence blocks first
  const fenceRegex = /```(?:json)?\s*([\s\S]*?)```/gi;
  let m: RegExpExecArray | null;
  while ((m = fenceRegex.exec(text)) !== null) {
    try { return tryParse(m[1]); } catch { /* continue */ }
  }
  // 2. Balanced brace scan
  for (let start = text.indexOf('{'); start !== -1; start = text.indexOf('{', start + 1)) {
    let depth = 0;
    for (let i = start; i < text.length; i++) {
      const ch = text[i];
      if (ch === '{') depth++;
      else if (ch === '}') {
        depth--;
        if (depth === 0) {
          const candidate = text.slice(start, i + 1);
          try { return tryParse(candidate); } catch { break; }
        }
      }
    }
  }
  throw new Error('No valid JSON object found');
}

async function generateQuickStartPhaseAI(plan: ProjectPlan, packageManager?: QuickStartPhase['packageManager']): Promise<QuickStartPhase> {
  const apiKey = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('Missing OPENROUTER_API_KEY (or OPENAI_API_KEY)');
  const pm = packageManager || inferPackageManager();
  const client = new OpenAI({
    apiKey,
    baseURL: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
    defaultHeaders: {
      ...(process.env.APP_URL ? { 'HTTP-Referer': process.env.APP_URL } : {}),
      'X-Title': 'ArchitectAI'
    }
  } as any);
  const minimalContext = {
    techStack: plan.overview.techStack,
    tasks: plan.tasks
  };
  const ctxJson = JSON.stringify(minimalContext);
  const system = 'You are a senior full-stack architect. Output ONLY raw JSON for a Quick Start guide (no markdown fences).';
  const user = `Produce a single JSON object with shape {"installCommands":string[],"copilotInstructions":{"filename":string,"content":string},"packageScripts":Record<string,string>,"envExample":string[],"packageManager":"npm"|"yarn"|"pnpm"|"bun","generatedAt":string} for packageManager='${pm}'.\n\nABSOLUTE RULES:\n- Output ONLY raw JSON (no markdown fences, no commentary before/after).\n- JSON must be syntactically valid on first parse.\n- Do NOT escape markdown characters inside copilotInstructions.content unnecessarily.\n- Keep copilotInstructions.content under 170 lines (hard cap) and < 12,000 characters.\n- Focus content on actionable quick start guidance only. No motivational fluff.\n- Use the provided tech stack ONLY for dependencies/scripts.\n\nCONTENT FORMAT SPEC FOR copilotInstructions.content (Markdown):\n# Project Quick Start\n1. Overview (1 short paragraph: purpose of the plan)\n2. Tech Stack (bulleted list using plan.overview.techStack)\n3. Install\n   - List install commands (these MUST mirror installCommands array exactly, each as inline code)\n4. Scripts\n   - Table or bullet list of script name => description (infer concise description)\n5. Environment Variables\n   - Bullet each variable: NAME - purpose (must mirror envExample list; do not invent extras)\n   - Provide a fenced shell snippet with example exports (.env style, no comments inline)\n6. Development Workflow\n   - Steps: Plan -> Scaffold -> Implement -> Test -> Review -> Merge -> Deploy\n   - Each step: 1 concise actionable sentence\n7. Coding Standards\n   - TypeScript / React rules (imports order, naming, hooks rules, no default export if not needed, etc.)\n   - Linting & formatting (mention ESLint + Prettier)\n   - Commit convention (Conventional Commits pattern with examples)\n8. Architecture Outline\n   - Describe (Domain, Application, Infrastructure, UI) in short bullets\n9. Task Types\n   - Feature, Refactor, Bug, Chore, Test (each: one-line definition)\n10. AI Collaboration Protocol\n   - Request Format, Edit Plan Requirement (1..n), Single-change commits, Review prompts\n11. Definition of Done\n   - Bullet checklist: tests pass, types clean, accessibility baseline, security review, docs updated\n12. Security & Compliance\n   - Input validation, auth (if present), secrets handling, dependency updates cadence\n13. Testing Strategy\n   - Pyramid: unit > integration > e2e (brief) + what to test vs skip\n14. Performance & Observability\n   - Metrics to watch, logging guidance (structured), avoid premature optimization notes\n15. Accessibility Checklist\n   - Bullets: semantic HTML, aria-labels, color contrast, focus order, keyboard nav\n16. Next Suggested Actions\n   - 3 actionable next tasks derived from the earliest unstarted high-level tasks in provided plan.tasks (truncate each to < 80 chars)\n\nCONSTRAINTS & VALIDATION:\n- copilotInstructions.filename MUST be "copilot-instructions.md" exactly.\n- No section numbers should contain trailing periods.\n- No empty sections. If data missing, omit the bullet instead of fabricating.\n- envExample MUST NOT include placeholder secrets unless implied (auth/db/third-party keys).\n- generatedAt: current ISO 8601 timestamp.\n- installCommands: must include framework core dependencies from stack only (avoid duplicates).\n- Scripts: include dev/build/start/lint plus test if testing libs appear in stack.\n\nOPTIMIZATIONS:\n- Trim redundant adjectives.\n- Prefer active voice.\n- Avoid future tense where present tense works.\n\nFAIL CONDITIONS (AVOID):\n- Additional JSON keys not specified.\n- Prose outside the JSON root object.\n- Using markdown code fences around the whole JSON.\n\nContext: ${ctxJson}`;
  const attempts = 3;
  let lastErr: any;
  for (let i = 0; i < attempts; i++) {
    try {
      const completion = await withTimeout(client.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'qwen/qwen3-235b-a22b:free',
        temperature: 0.4,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user + `\nAttempt:${i + 1}` }
        ]
      } as any), Math.max(3000, Math.min(MAX_AI_MS, MAX_AI_MS - (i * 1500))), 'quickstart-ai');
      const text = completion.choices?.[0]?.message?.content?.trim() || '';
      if (!text) throw new Error('Empty response');
      const cleaned = text.replace(/^```json\s*/i, '').replace(/^```/, '').replace(/```\s*$/, '').trim();
      const parsed = extractJsonBlock(cleaned);
      const arr = (v: any) => Array.isArray(v) ? v.map(String) : [];
      // Normalize copilot instructions filename (convert QUICKSTART.md variants to copilot-instructions.md)
      const rawCopilot = parsed.copilotInstructions && parsed.copilotInstructions.content
        ? parsed.copilotInstructions
        : { filename: 'copilot-instructions.md', content: '# Quick Start\nAI output missing instructions.' };
      const normalizedName = /quickstart\.md/i.test(rawCopilot.filename || '') ? 'copilot-instructions.md' : 'copilot-instructions.md';
      const phase: QuickStartPhase = {
        installCommands: arr(parsed.installCommands),
        copilotInstructions: { filename: normalizedName, content: rawCopilot.content },
        packageScripts: parsed.packageScripts && typeof parsed.packageScripts === 'object' ? parsed.packageScripts : {},
        envExample: arr(parsed.envExample),
        packageManager: pm,
        // Always stamp generation time locally to avoid accepting stale/incorrect timestamps from model output
        generatedAt: new Date().toISOString()
      };
      if (!phase.installCommands.length) throw new Error('Missing installCommands');
      return phase;
    } catch (e) {
      lastErr = e;
      await new Promise(r => setTimeout(r, 400 * (i + 1)));
    }
  }
  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.warn('Quick Start AI failed (OpenRouter), returning minimal fallback:', lastErr?.message || lastErr);
  }
  return minimalFallback(plan, packageManager || inferPackageManager());
}

export async function generateQuickStartPhase(plan: ProjectPlan, packageManager?: QuickStartPhase['packageManager']): Promise<QuickStartPhase> {
  return generateQuickStartPhaseAI(plan, packageManager);
}
