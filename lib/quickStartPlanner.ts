import { ProjectPlan, QuickStartPhase } from '@/types/project';
import { AIClientConfig } from '@/types/ai';
import fs from 'fs';
import path from 'path';
import OpenAI from 'openai';

// Retain only minimal package manager inference; all other logic-based planning removed per request.
async function inferPackageManager(): Promise<QuickStartPhase['packageManager']> {
	try {
		const root = process.cwd();
		const exists = async (f: string) => {
			try {
				await fs.promises.stat(path.join(root, f));
				return true;
			} catch {
				return false;
			}
		};
		const [hasPnpm, hasYarn, hasBun, hasNpm] = await Promise.all([
			exists('pnpm-lock.yaml'),
			exists('yarn.lock'),
			exists('bun.lockb'),
			exists('package-lock.json')
		]);
		if (hasPnpm) return 'pnpm';
		if (hasYarn) return 'yarn';
		if (hasBun) return 'bun';
		if (hasNpm) return 'npm';
	} catch { }
	return 'npm';
}

function minimalFallback(plan: ProjectPlan, pm: QuickStartPhase['packageManager']): QuickStartPhase {
	const content = `# COPILOT EDITS OPERATIONAL GUIDELINES
 
 ## PRIME DIRECTIVE
 	Avoid working on more than one file at a time.
 	Multiple simultaneous edits to a file will cause corruption.
 	Be chatting and teach about what you are doing while coding.
 
 ## LARGE FILE & COMPLEX CHANGE PROTOCOL
 
 ### MANDATORY PLANNING PHASE
 	When working with large files (>300 lines) or complex changes:
 		1. ALWAYS start by creating a detailed plan BEFORE making any edits
             2. Your plan MUST include:
                    - All functions/sections that need modification
                    - The order in which changes should be applied
                    - Dependencies between changes
                    - Estimated number of separate edits required
                 
             3. Format your plan as:
 ## PROPOSED EDIT PLAN
 	Working with: [filename]
 	Total planned edits: [number]
 
 ### MAKING EDITS
 	- Focus on one conceptual change at a time
 	- Show clear "before" and "after" snippets when proposing changes
 	- Include concise explanations of what changed and why
 	- Always check if the edit maintains the project's coding style
 
 ### Edit sequence:
 	1. [First specific change] - Purpose: [why]
 	2. [Second specific change] - Purpose: [why]
 	3. Do you approve this plan? I'll proceed with Edit [number] after your confirmation.
 	4. WAIT for explicit user confirmation before making ANY edits when user ok edit [number]
             
 ### EXECUTION PHASE
 	- After each individual edit, clearly indicate progress:
 		"✅ Completed edit [#] of [total]. Ready for next edit?"
 	- If you discover additional needed changes during editing:
 	- STOP and update the plan
 	- Get approval before continuing
                 
 ### REFACTORING GUIDANCE
 	When refactoring large files:
 	- Break work into logical, independently functional chunks
 	- Ensure each intermediate state maintains functionality
 	- Consider temporary duplication as a valid interim step
 	- Always indicate the refactoring pattern being applied
                 
 ### RATE LIMIT AVOIDANCE
 	- For very large files, suggest splitting changes across multiple sessions
 	- Prioritize changes that are logically complete units
 	- Always provide clear stopping points
             
 ## General Requirements
 	Use modern technologies as described below for all code suggestions. Prioritize clean, maintainable code with appropriate comments.
             
 ### Accessibility
 	- Ensure compliance with WCAG 2.1 AA level minimum, AAA whenever feasible.
 	- Always suggest:
 	- Labels for form fields.
 	- Proper ARIA roles and attributes.
 	- Adequate color contrast.
 	- Alternative texts (\`alt\`, \`aria-label\`) for media elements.
 	- Semantic HTML for clear structure.
 	- Tools like Lighthouse for audits.
         
 ## Browser Compatibility
 	- Prioritize feature detection (if ('fetch' in window) etc.).
         - Support latest two stable releases of major browsers:
 	- Firefox, Chrome, Edge, Safari (macOS/iOS)
         - Emphasize progressive enhancement with polyfills or bundlers (e.g., Babel, Vite) as needed.
             
 ## PHP Requirements
 	- Target Version: PHP 8.1 or higher
 	- Features to Use:
 	- Named arguments
 	- Constructor property promotion
 	- Union types and nullable types
 	- Match expressions
 	- Nullsafe operator (\`?->\`)
 	- Attributes instead of annotations
 	- Typed properties with appropriate type declarations
 	- Return type declarations
 	- Enumerations (enum)
 	- Readonly properties
 	- Emphasize strict property typing in all generated code.
 	- Coding Standards:
 	- Follow PSR-12 coding standards
 	- Use strict typing with declare(strict_types=1);
 	- Prefer composition over inheritance
 	- Use dependency injection
 	- Static Analysis:
 	- Include PHPDoc blocks compatible with PHPStan or Psalm for static analysis
 	- Error Handling:
 	- Use exceptions consistently for error handling and avoid suppressing errors.
 	- Provide meaningful, clear exception messages and proper exception types.
             
 ## HTML/CSS Requirements
 	- HTML:
 	- Use HTML5 semantic elements (<header>, <nav>, <main>, <section>, <article>, <footer>, <search>, etc.)
 	- Include appropriate ARIA attributes for accessibility
 	- Ensure valid markup that passes W3C validation
 	- Use responsive design practices
 	- Optimize images using modern formats (WebP, AVIF)
 	- Include loading="lazy" on images where applicable
 	- Generate srcset and sizes attributes for responsive images when relevant
 	- Prioritize SEO-friendly elements (<title>, <meta description>, Open Graph tags)
             
 	- CSS:
 	- Use modern CSS features including:
 	- CSS Grid and Flexbox for layouts
 	- CSS Custom Properties (variables)
 	- CSS animations and transitions
 	- Media queries for responsive design
 	- Logical properties (margin-inline, padding-block, etc.)
 	- Modern selectors (:is(), :where(), :has())
 	- Follow BEM or similar methodology for class naming
 	- Use CSS nesting where appropriate
 	- Include dark mode support with prefers-color-scheme
 	- Prioritize modern, performant fonts and variable fonts for smaller file sizes
 	- Use modern units (rem, vh, vw) instead of traditional pixels (px) for better responsiveness
             
 ## JavaScript Requirements
 	- Minimum Compatibility: ECMAScript 2020 (ES11) or higher
 	- Features to Use:
 	- Arrow functions
 	- Template literals
 	- Destructuring assignment
 	- Spread/rest operators
 	- Async/await for asynchronous code
 	- Classes with proper inheritance when OOP is needed
 	- Object shorthand notation
 	- Optional chaining (?.)
 	- Nullish coalescing (??)
 	- Dynamic imports
 	- BigInt for large integers
 	- Promise.allSettled()
 	- String.prototype.matchAll()
 	- globalThis object
 	- Private class fields and methods
 	- Export * as namespace syntax
 	- Array methods (map, filter, reduce, flatMap, etc.)
 	- Avoid:
 	- var keyword (use const and let)
 	- jQuery or any external libraries
 	- Callback-based asynchronous patterns when promises can be used
 	- Internet Explorer compatibility
 	- Legacy module formats (use ES modules)
 	- Limit use of eval() due to security risks
 	- Performance Considerations:
 	- Recommend code splitting and dynamic imports for lazy loading
 	- Error Handling:
 	- Use try-catch blocks consistently for asynchronous and API calls, and handle promise rejections explicitly.
 	- Differentiate among:
 	- Network errors (e.g., timeouts, server errors, rate-limiting)
 	- Functional/business logic errors (logical missteps, invalid user input, validation failures)
 	- Runtime exceptions (unexpected errors such as null references)
 	- Provide user-friendly error messages and log technical details separately.
 	- Consider a central error handler or global events for reporting.
 	- Carefully handle and validate JSON responses and HTTP status codes.
             
 ## Folder Structure
 	project-root/
 	├── api/
 	├── config/
 	├── data/
 	├── public/
 	│   ├── assets/
 	│   │   ├── css/
 	│   │   ├── js/
 	│   │   ├── images/
 	│   │   ├── fonts/
 	│   └── index.html
 	├── src/
 	│   ├── controllers/
 	│   ├── models/
 	│   ├── views/
 	│   └── utilities/
 	├── tests/
 	├── docs/
 	├── logs/
 	├── scripts/
 	└── temp/
 
 ## Documentation Requirements
 	- Include JSDoc comments for JavaScript/TypeScript.
 	- Document complex functions with clear examples.
 	- Maintain concise Markdown documentation.
 	- Minimum docblock info: param, return, throws, author
     
 ## Database Requirements (SQLite 3.46+)
 	- Leverage JSON columns, generated columns, strict mode, foreign keys, check constraints, and transactions.
     
 ## Security Considerations
 	- Sanitize all user inputs thoroughly.
 	- Parameterize database queries.
 	- Enforce strong Content Security Policies (CSP).
 	- Use CSRF protection where applicable.
 	- Ensure secure cookies (HttpOnly, Secure, SameSite=Strict).
 	- Limit privileges and enforce role-based access control.
 	- Implement detailed internal logging and monitoring.
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

async function generateQuickStartPhaseAI(plan: ProjectPlan, packageManager?: QuickStartPhase['packageManager'], aiConfig?: AIClientConfig): Promise<QuickStartPhase> {
	const apiKey = aiConfig?.apiKey?.trim() || process.env.OPENAI_API_KEY;
	const baseURL = aiConfig?.baseURL?.trim() || process.env.OPENAI_BASE_URL;
	const model = aiConfig?.model?.trim() || process.env.OPENAI_MODEL || 'gemini-2.5-pro';

	if (!apiKey && !baseURL?.includes('localhost')) throw new Error('Missing AI API key. Please configure your API key in AI Settings.');
	const pm = packageManager || await inferPackageManager();

	const client = new OpenAI({
		apiKey: apiKey || 'dummy',
		baseURL: baseURL || undefined,
	});

	const minimalContext = {
		techStack: plan.overview.techStack,
		tasks: plan.tasks
	};
	const ctxJson = JSON.stringify(minimalContext);
	const system = 'You are a senior full-stack architect. Output ONLY raw JSON for a Quick Start guide (no markdown fences).';
	const user = `Produce a single JSON object with shape {"installCommands":string[],"copilotInstructions":{"filename":string,"content":string},"packageScripts":Record<string,string>,"envExample":string[],"packageManager":"npm"|"yarn"|"pnpm"|"bun","generatedAt":string} for packageManager='${pm}'.\n\nABSOLUTE RULES:\n- Output ONLY raw JSON (no markdown fences, no commentary before/after).\n- JSON must be syntactically valid on first parse.\n- Do NOT escape markdown characters inside copilotInstructions.content unnecessarily.\n- Keep copilotInstructions.content under 170 lines (hard cap) and < 12,000 characters.\n- Focus content on actionable quick start guidance only. No motivational fluff.\n- Use the provided tech stack ONLY for dependencies/scripts.\n\nCONTENT FORMAT SPEC FOR copilotInstructions.content (Markdown):\n# Project Quick Start\n1. Overview (1 short paragraph: purpose of the plan)\n2. Tech Stack (bulleted list using plan.overview.techStack)\n3. Install\n   - List install commands (these MUST mirror installCommands array exactly, each as inline code)\n4. Scripts\n   - Table or bullet list of script name => description (infer concise description)\n5. Environment Variables\n   - Bullet each variable: NAME - purpose (must mirror envExample list; do not invent extras)\n   - Provide a fenced shell snippet with example exports (.env style, no comments inline)\n6. Development Workflow\n   - Steps: Plan -> Scaffold -> Implement -> Test -> Review -> Merge -> Deploy\n   - Each step: 1 concise actionable sentence\n7. Coding Standards\n   - TypeScript / React rules (imports order, naming, hooks rules, no default export if not needed, etc.)\n   - Linting & formatting (mention ESLint + Prettier)\n   - Commit convention (Conventional Commits pattern with examples)\n8. Architecture Outline\n   - Describe (Domain, Application, Infrastructure, UI) in short bullets\n9. Task Types\n   - Feature, Refactor, Bug, Chore, Test (each: one-line definition)\n10. Vibe Coding Section (AI... \n\nContext: ${ctxJson}`;
	const attempts = 3;
	let lastErr: any;
	for (let i = 0; i < attempts; i++) {
		try {
			const result = await client.chat.completions.create({
				model,
				temperature: 1.0,
				messages: [
					{ role: 'system', content: system },
					{ role: 'user', content: user + `\nAttempt:${i + 1}` }
				]
			});
			const text = result.choices[0]?.message?.content?.trim() || '';
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
		console.warn('Quick Start AI failed (OpenAI Proxy), returning minimal fallback:', lastErr?.message || lastErr);
	}
	return minimalFallback(plan, packageManager || await inferPackageManager());
}

export async function generateQuickStartPhase(plan: ProjectPlan, packageManager?: QuickStartPhase['packageManager'], aiConfig?: AIClientConfig): Promise<QuickStartPhase> {
	return generateQuickStartPhaseAI(plan, packageManager, aiConfig);
}
