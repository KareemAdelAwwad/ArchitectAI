# Product Requirements Document (PRD)

## 1. Product Name

ArchitectAI – AI-Powered Project Planning Assistant

## 2. Elevator Pitch

An authenticated Next.js web app that turns a raw software project idea into a structured, Waterfall-aligned pre-development plan (scope, requirements, architecture, API, schema, and UI outline), saving each generated plan for easy recall and iteration.

## 3. Problem Statement

Early-stage project teams and solo builders struggle to translate loosely formed ideas into clear, actionable specifications. This leads to scope creep, misaligned expectations, and rework. Existing tools either require heavy manual modeling or produce unstructured AI text. ArchitectAI bridges the gap by generating standardized, structured planning artifacts rapidly and storing them for ongoing reference.

## 4. Goals & Success Metrics

**Primary Goals**

- Rapid structured plan generation (≤ 6s median response).
- Persist and retrieve historical plans per user.
- Enforce consistent Waterfall Planning → Analysis → Design outputs.

**Success Metrics (Phase 1)**

- First Plan Generation Success Rate: ≥ 95%
- Median Generation Time: ≤ 6s
- Return Visit Rate (7-day): ≥ 30%
- Plans per Active User (monthly median): ≥ 3
- Error Rate (5xx per request): < 1%

**Secondary Metrics**

- Time to First Plan (signup to plan): < 2 minutes
- Auth Conversion (landing → sign-in): ≥ 40%

## 5. Personas

1. Solo Developer / Indie Hacker: Wants quick structure for idea validation.
2. Tech Lead / Architect: Needs systematic lens for early project shaping.
3. Product Manager (future persona): Compares multiple project variants.

## 6. In Scope (Phase 1)

- GitHub OAuth authentication
- Project idea form (description, project type, optional tech preferences)
- AI-backed generation of Waterfall Planning, Analysis, Design outputs
- Structured JSON storage of plans
- Sidebar listing user’s previous plans
- Plan detail viewing
- Basic error + loading states
- Environment-based configuration

## 7. Out of Scope (Phase 1)

- Multi-user collaboration on a single plan
- Editing plans post-generation
- Export (PDF/Markdown)
- Implementation / Testing / Deployment phases
- Role-based access control beyond simple user session
- Billing / paid tiers

## 8. Key Features (MoSCoW)

**Must Have**

- Auth (GitHub)
- Plan submission + validation
- Structured phased output
- Persistent storage & retrieval
- Sidebar plan list & selection
- Ownership enforcement

**Should Have**

- Suggested tech stack if none supplied
- Loading skeletons & toasts
- Deep-link to specific plan

**Could Have**

- Regenerate / refine plan
- Copy / export to clipboard
- Basic search/filter in sidebar

**Future / Won’t Now**

- Team workspaces
- AI comparison between plans
- Additional methodologies (Agile, Hybrid)
- Editable live requirements

## 9. User Stories (Representative)

- As a signed-in user, I can submit an idea with project type so I receive a structured plan.
- As a user, I can view a list of my previously generated plans to reopen them.
- As a user, I can click a plan in the sidebar to load its full details.
- As a user, I see a clear separation of Planning, Analysis, and Design outputs.
- As a user without tech preferences, I get reasonable suggested stacks.

## 10. User Flows (High-Level)

**Flow: Generate Plan**
Login → Form Input → Submit → Loading → Display Phases Accordion → Auto-save Plan → Sidebar updates with new entry.

**Flow: Reopen Plan**
Login (session) → Sidebar loads (GET /plans) → Click plan → Detail loaded.

## 11. Functional Requirements

FR1 Auth via GitHub; unauthenticated users cannot create/view plans.
FR2 Input form requires: description (≥ 30 chars), projectType enum (frontend|backend|fullstack).
FR3 Optional techPreferences array (0–8 items; ≤ 25 chars each).
FR4 POST /api/plans validates, generates Waterfall phases, persists Plan.
FR5 GET /api/plans returns list (id, title, createdAt).
FR6 GET /api/plans/:id returns full plan if ownership passes.
FR7 Sidebar refresh reflects newly created plan within 2s.
FR8 Generation logic always returns all three phase objects with required keys (no partials).
FR9 Error states: validation (400), unauthorized (401), forbidden ownership (403), server error (500).
FR10 Suggested tech stack produced if user input stack empty.

## 12. Non-Functional Requirements

Performance: p95 API plan generation < 9s; static pages TTFB < 500ms.
Availability: 99% (single-region acceptable early).
Scalability: Handle 50 concurrent generations (queue or direct).
Security: No cross-user data leakage; secure session handling; secrets only in env.
Data Integrity: Atomic plan creation (either full plan or none).
Observability: Log generation duration & errors with classification.
Privacy: Store only minimal user data (id, name, email from provider).
Accessibility: WCAG AA basics (focus, semantic structure, color contrast).
Reliability: Mongo connection retry with backoff (3 attempts).
Maintainability: Typed schemas (Zod + TypeScript) enforce structure.

## 13. Architecture Overview

Client (Next.js App Router + React components) → API Routes (/api/plans, /api/plans/[id]) → Generation Service (deterministic template + optional LLM call adapter) → MongoDB (plans collection). Auth handled via NextAuth with GitHub provider and Mongo adapter. Edge optional (not required initially).

## 14. Data Model (Mongo)

```
plans
{
  _id: ObjectId,
  userId: string (indexed),
  title: string,
  projectType: 'frontend'|'backend'|'fullstack',
  techStackSuggested: [string],
  inputDescription: string,
  phases: {
    planning: {
      scope: string,
      stakeholders: string[],
      timeline: { planningHrs: number, analysisHrs: number, designHrs: number },
      resources: string[],
      risks: [{ risk: string, mitigation: string }]
    },
    analysis: {
      functionalRequirements: string[],
      nonFunctionalRequirements: string[],
      userStories: string[],
      constraints: string[],
      integrations: string[]
    },
    design: {
      architecture: string,
      databaseSchema: string,
      apiEndpoints: string[],
      uiDescription: string,
      codingStandards: string[]
    }
  },
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes**

- plans.userId + createdAt (compound for sorting)
- (Optional future) text index on title/inputDescription

## 15. API Specification (Initial)

**POST /api/plans**
Req Body: `{ description: string, projectType: string, techPreferences?: string[] }`
Responses:

- 201 `{ id, title, createdAt, phases {...}, projectType, techStackSuggested }`
- 400 validation error
- 401/403 auth/ownership
- 500 server error (masked message)

**GET /api/plans**

- 200 `[{ id, title, createdAt }]`

**GET /api/plans/:id**

- 200 full plan
- 404 if not found or owned by someone else (avoid disclosing existence)

## 16. Generation Logic (Phase Structurer)

Steps:

1. Normalize input (trim, collapse whitespace).
2. Derive inferred attributes (complexity keywords).
3. Produce structured objects using templates + (optional) LLM fill for narrative sections.
4. Validate each phase against Zod schema.
5. Persist only after all phases validate.

Fallback: If LLM call fails, fallback deterministic rule-set text (still structured) + tag plan.phases.design.architecture += "[fallback]".

## 17. UX / UI Outline

Layout: Left sidebar (list + add new button if space), top bar with auth status. Main panel: form (top) → generated accordion (below). Empty states: “No plans yet – create your first plan.” Loading skeleton for accordion blocks.

## 18. Assumptions

- Users are comfortable with GitHub OAuth.
- Idea descriptions are in English.
- MongoDB Atlas available & network accessible.
- Single user concurrency per plan is adequate.

## 19. Constraints

- No sensitive PII beyond standard GitHub profile.
- Free tier model usage (cost-sensitive).
- Single database; no sharding early.
- Avoid vendor lock-in by abstracting LLM provider.

## 20. External Dependencies

- GitHub OAuth
- MongoDB Atlas
- (Optional) OpenAI or compatible API (pluggable)

## 21. Risks & Mitigations

- Hallucinated / inconsistent structure → Strict schema validation + fallback templates.
- Model latency spikes → Timeout & fallback path (< 8s).
- Data leakage across users → Always filter by userId server-side; never trust client user id.
- Secrets exposure → Use .env & runtime validation; disallow logging env vars.
- Scaling read of plans → Index userId + createdAt; implement pagination later.
- User abandonment if first experience slow → Pre-generate skeleton; show progress indicator.

## 22. Release Plan (Milestones)

- M1 (Week 1): Auth + Mongo setup + Plan schema + POST generation (static template).
- M2 (Week 2): Sidebar & retrieval endpoints (GET list/detail).
- M3 (Week 3): LLM integration (optional) + improved formatting + deep linking.
- M4 (Week 4): Hardening (tests, logging, performance) + minimal Docker deploy.
- M5 (Stretch): Regeneration/refinement feature.

## 23. Analytics & Telemetry

Events:

- plan_created (duration_ms, tech_pref_count)
- plan_viewed (plan_age_days)
- sidebar_loaded (plan_count)
- generation_failed (error_code)
  Basic approach: Console / lightweight custom logger → future pipeline.

## 24. Privacy & Security

- Store only necessary fields.
- Session tokens via NextAuth; no custom JWT claims beyond user id.
- Disallow arbitrary plan id enumeration (ownership check + 404 uniform response).
- Rate limiting (future): per-user POST /api/plans (e.g., 20/day).

## 25. Open Questions

- Will future methodologies (Agile, Hybrid) affect initial schema? (Plan: make phases a keyed object; safe.)
- Should users rename plans? (Deferred.)
- Persistence of refined versions (versioning) needed soon? (Not in Phase 1.)
- Need organization/team sharing? (Future enterprise scope.)

## 26. Future Enhancements (Backlog)

- Export (Markdown/PDF).
- Compare two plans.
- AI refinement / iteration.
- Tagging & search.
- Multi-phase expansion (Implementation, Testing, Deployment).
- Role-based access & shared workspaces.
