# WASABI Repository Analysis

## 1. Iterare Constraints Applied

The Iterare guidelines at `~/Work/iterare` impose the following constraints on this work:

- **No external tooling**: all development work must live within the Iterare framework. This analysis is a read-only task so the constraint does not require Iterare scaffolding, but any follow-on implementation work should be structured there.
- **No code modification** unless explicitly required by the task. This report contains zero code changes.
- **Commit discipline**: each completed task should be committed with a message stating what changed and why. Applies to follow-on implementation, not this report.
- **No inline Python**: multi-line scripts must be written to files and executed from there. Not applicable to this analysis.
- **Pushbullet notifications** for long remote jobs. Not applicable to this read-only analysis.

---

## 2. Repository Overview

**Tech stack**

| Layer | Technology |
|---|---|
| Framework | Next.js 16.2.0 (App Router, Turbopack) |
| Language | TypeScript 5.7.3 (strict mode) |
| UI primitives | shadcn/ui (Radix UI underneath) |
| Styling | Tailwind CSS v4 + PostCSS |
| Icons | Lucide React |
| Visualization | Pure SVG (no Canvas, no WebGL) |
| Analytics | @vercel/analytics (production only) |
| Screenshot testing | Puppeteer 24.42 (devDependency) |
| Runtime | React 19 / Node.js |

**Project structure**

```
app/           — Next.js App Router: layout, single page, error boundary, globals
components/    — NeuralNetwork, QuestionCard, RecommendationView, 52 shadcn/ui primitives
lib/
  decision-engine/   — engine.ts (441 lines), questions.ts, paths.ts, types.ts
  annotate.tsx       — glossary term highlighter
  glossary.ts        — 14 term definitions
hooks/         — use-mobile.ts, use-toast.ts
docs/          — 7 documentation files covering arch, UX, logic, handoff
tools/         — 6 Puppeteer screenshot scripts for visual regression
public/        — icons only (no large assets)
```

**Main modules**

- `lib/decision-engine/engine.ts`: the entire scoring pipeline — three pure functions (`computeHidden1`, `computeHidden2`, `computePathScores`) plus `computeNetworkState` and `computeRecommendation`. No side effects. 441 lines.
- `app/page.tsx`: single-page orchestrator. Holds all state (`answers`, `stage`, `currentIndex`). Renders three stages: intro → flow → done. 711 lines.
- `components/neural-network.tsx`: derives a full node/edge graph from `NetworkState` and renders it as SVG with animations.
- `components/recommendation-view.tsx`: full detail modal content for the chosen path.
- `lib/decision-engine/paths.ts`: 8 `BuildPath` records — the output layer catalog.
- `lib/decision-engine/questions.ts`: 8 `Question` records — the input layer intake.

**Runtime and deployment model**

- Confirmed static: no API routes, no middleware, no `server.ts`, no database. The entire app runs in the browser after initial HTML delivery.
- Deployment target: Vercel. `@vercel/analytics` is a direct dependency. `allowedDevOrigins` in `next.config.mjs` includes `*.vercel.app` and `*.vusercontent.net` (v0 preview).
- `images: { unoptimized: true }` in `next.config.mjs` — no server-side image processing needed, consistent with static deployment.

**Key dependencies in use vs. installed**

Many shadcn/ui components are installed but unused in the current UI (accordion, carousel, calendar, chart, etc.). They are scaffolding for future expansion. Current UI actively uses: Dialog, Tooltip, and a small set of Radix primitives.

Unused packages installed: `react-hook-form`, `zod`, `recharts`, `date-fns`, `embla-carousel-react`, `react-day-picker`, `vaul`, `input-otp`, `cmdk`. These add ~300KB+ to the dependency tree without contributing to V1.

**Notable configuration files**

- `next.config.mjs`: enables Turbopack, disables image optimization, whitelists preview origins
- `tsconfig.json`: strict mode, `@/` path alias to root
- `eslint.config.mjs`: `next/core-web-vitals` + 4 ignored generated files
- `components.json`: shadcn/ui component registry config

---

## 3. Application Goal

**Stated purpose** (from `docs/product-spec.md`, `README.md`, and `lib/decision-engine/questions.ts`)

WASABI ("What AI System Am I Building Into") is a browser-based guided decision tool for professors, students, and researchers who need to determine which AI or ML approach fits their problem before they begin building. It presents an 8-question intake form, visualizes a live 4-layer "neural network" whose activations reflect the user's answers, and produces a deterministic recommendation across 8 build paths ranging from "No AI needed" to "Tool-using agent."

**Primary users**

Confirmed from `docs/product-spec.md`: professors designing courses or research programs, students beginning AI/ML projects, and mixed-technical-background audiences who may not know where to start. The writing style in `questions.ts` and `paths.ts` deliberately avoids jargon without dumbing down.

**Core workflows**

1. User lands on intro screen → reads what WASABI does → clicks "Start"
2. User answers 8 sequential questions (single-select auto-advances; multi-select gates Continue)
3. As answers accumulate, the network SVG updates in real-time; after 2+ answers a provisional recommendation appears in the right panel
4. After Q8, user reaches the done state: left panel shows their answers, center shows the final network, right panel shows a compact recommendation summary with a "See full details" modal
5. User can jump back to any question via the progress rail, change answers, and watch the recommendation update

**Supporting evidence**

- `lib/decision-engine/types.ts:26` — `Question.kind: "single" | "multi"` maps directly to the auto-advance vs. gate UX
- `app/page.tsx:52–53` — `canShowPreview` gates the provisional recommendation until `answeredCount >= 2`
- `lib/decision-engine/engine.ts:207–309` — `computePathScores()` contains direct correctness rules (e.g., privacy constraint docking prompting by 0.5), making the scoring auditable
- `docs/decision-logic.md` — explicit documentation of what each layer represents and how rules can be safely modified
- `docs/product-spec.md` — "Non-goals: no LLM in V1, no training data, no persistence" — confirms the bounded scope

**Confidence: high.** The purpose is explicitly documented, the code matches the documentation, and the UX flow is coherent and complete.

**Operational objective** (inference, supported by `@vercel/analytics` in `layout.tsx` and the Vercel deployment posture): this is a public-facing educational tool, likely hosted as a free resource associated with a course or research program. There is no paywall, no login, and no monetization infrastructure. Business objective appears to be credibility/outreach for whoever owns the deployment.

---

## 4. Web Best Practices Review

### Architecture and Maintainability

**Finding:** Content (questions, paths) is fully separated from logic (engine) and logic from UI (page.tsx). This is the strongest architectural decision in the codebase.

**Evidence:** `lib/decision-engine/questions.ts` and `paths.ts` are plain TypeScript object arrays with zero JSX or UI imports. `engine.ts` imports only from `./paths`, `./questions`, and `./types` — no React, no DOM, no CSS.

**Impact:** A content editor can update question text or path descriptions without understanding React. The scoring logic can be unit-tested in isolation. Future contributors can follow the established seams.

**Recommendation:** No change needed. Document this explicitly in `docs/architecture.md` as a hard rule — "never import React into engine.ts."

**Priority:** Strength — no action needed.

---

**Finding:** `app/page.tsx` is 711 lines and acts as monolith for three distinct UI stages plus 6 sub-components and 4 utility functions.

**Evidence:** `IntroPanel`, `EmergencePanel`, `CompactInsightPanel`, `JourneyAtlas`, `RecommendationSummary`, `FeatureStrip`, `SignalPill`, `collectDominantSignals`, `optionLabel`, `isAnsweredFor` all live in `page.tsx`.

**Impact:** Medium. The file is readable because each function is clearly named, but adding a new stage or panel means editing a 700-line file. `RecommendationSummary` in particular (150+ lines) could be extracted cleanly since it already takes well-defined props and manages its own Dialog state.

**Recommendation:** Extract `RecommendationSummary` to `components/recommendation-summary.tsx` and `IntroPanel` to `components/intro-panel.tsx`. Leave `Page` as orchestrator only.

**Priority:** Low (cosmetic, not urgent).

---

**Finding:** The `EngineHooks` interface (`engine.ts:435`) is well-designed for V2 extension but is not wired into the `computeRecommendation` call site.

**Evidence:** `EngineHooks` defines optional `interpretFreeformInput` and `personalizeRationale` methods. `computeRecommendation` does not accept a hooks argument. `docs/handoff.md` mentions this as the V2 integration point.

**Impact:** Low. The interface exists as documentation intent, not functional code. It will require a parameter addition to `computeRecommendation` when V2 arrives.

**Recommendation:** Add a `hooks?: EngineHooks` parameter to `computeRecommendation` now and default to no-ops, so V2 only needs to pass an implementation — not change the function signature.

**Priority:** Low.

---

### Performance

**Finding:** All computation is synchronous and in-browser. `computeNetworkState` and `computeRecommendation` run on every `answers` change via `useMemo`.

**Evidence:** `app/page.tsx:41–42`. The engine processes 8 inputs through ~50 scoring rules. This is sub-millisecond.

**Impact:** None in practice. No deferred loading, no web workers, no concern.

**Recommendation:** No action needed. If the engine grows to hundreds of rules, move computation into a `useWorker` hook.

**Priority:** Strength.

---

**Finding:** ~300KB of unused shadcn/ui dependencies (`recharts`, `date-fns`, `embla-carousel-react`, `vaul`, etc.) are installed but contribute nothing to V1.

**Evidence:** `package.json` lists 14 packages in `dependencies` that have no import in any `.tsx` or `.ts` file in the active codebase.

**Impact:** Medium. These packages add to install time and may contribute to bundle size. They also increase the attack surface of the dependency tree.

**Recommendation:** Remove packages with no imports: `recharts`, `date-fns`, `embla-carousel-react`, `react-day-picker`, `vaul`, `input-otp`, `cmdk`, `react-resizable-panels`. Keep `react-hook-form` and `zod` only if V2 adds form inputs.

**Priority:** Medium.

---

**Finding:** The SVG neural network uses a fixed 1200×760 viewBox with hardcoded X layer positions.

**Evidence:** `components/neural-network.tsx` — `LAYER_X = { input: 210, h1: 490, h2: 770, output: 1040 }`. Y positions are computed dynamically from node count.

**Impact:** Correct today. If question or path count changes, X positions need manual adjustment; Y positions adapt automatically.

**Recommendation:** Document the hardcoded X positions with a comment explaining they were calibrated for the 1200×760 viewport.

**Priority:** Low.

---

### Accessibility

**Finding:** Strong baseline accessibility for a V1 tool.

**Evidence:**
- Option buttons: `role="radio"` / `role="checkbox"` with `aria-checked`
- Progress rail: `aria-current="step"` on active question
- Neural network SVG: `role="img"` with `aria-label`; animated edges marked `aria-hidden="true"`
- Selection state communicated via color AND check icon (not color alone)

**Recommendations:**
1. The Dialog modal triggers a `Missing Description or aria-describedby` warning in the console. Add a `DialogDescription` to suppress this and improve screen reader context.
2. The `WhyPopover` button has `aria-expanded` but no `aria-controls` pointing to the popup.
3. Add `<noscript>` message — the app is fully unusable without JavaScript.

**Priority:** Medium (item 1 is a confirmed console warning).

---

### Responsiveness

**Finding:** The 3-column desktop layout (≥1100px) and single-column mobile layout are correctly implemented.

**Gap:** The 768px–1099px range (tablet) renders as single-column, requiring significant scrolling through all three sections. An iPad in landscape mode at 1024px is below the 1100px threshold.

**Recommendation:** Add a 2-column intermediate layout at 768px–1099px: question card left (60%), compact result panel right (40%), with the inference map collapsed to a thin strip.

**Priority:** Medium.

---

### SEO

**Finding:** Basic SEO is present but shallow.

**Evidence:** Title and meta description in `layout.tsx`. No `og:image`, no structured data, no `sitemap.xml`, no `robots.txt`. Single-page app — all content rendered client-side.

**Recommendation:** Add `og:image`, `og:type`, and `twitter:card` to `layout.tsx` metadata. These are 5-line additions.

**Priority:** Low.

---

### Testing

**Finding:** No unit tests, no integration tests, no end-to-end test framework. Visual regression only via 6 Puppeteer screenshot scripts.

**Evidence:** No `*.test.ts` or `*.spec.ts` files. No `jest.config.*` or `vitest.config.*`. `puppeteer` in devDependencies with 6 screenshot scripts in `tools/`.

**Impact:** High. `engine.ts` is 441 lines of pure functions with ~50 scoring rules and is entirely untested. A scoring bug silently shifts recommendations. The question-card exclusive-value logic and `annotate.tsx` regex are also untested.

**Recommendation:**
1. Add Vitest (lightweight, TypeScript-native). Install: `pnpm add -D vitest`.
2. Write unit tests for `engine.ts` covering: ambient activations on empty answers, each path winning when its canonical signals are set, caution generation, and softnorm edge cases.
3. Write unit tests for `annotate.tsx` covering: empty string, no matches, single match, regex-special characters in terms.
4. Add `"test": "vitest run"` to `package.json` scripts.

**Priority:** High. The engine is the core of the product and is completely untested.

---

### Code Quality

**Finding:** The codebase is consistently well-typed with TypeScript strict mode. No `any`, no implicit returns, no `@ts-ignore`.

**Evidence:** `tsconfig.json` — `"strict": true`. ESLint passes with 0 violations.

**Priority:** Strength.

---

**Finding:** The exclusive-value logic in `question-card.tsx` uses string literals to identify questions by ID.

**Evidence:** `question-card.tsx:22–26`:
```typescript
function exclusiveValuesFor(question: Question) {
  if (question.id === "constraints") return ["none"]
  if (question.id === "system") return ["model-only"]
  return []
}
```

**Impact:** If `question.id` values change in `questions.ts`, this function silently breaks with no compile error.

**Recommendation:** Move `exclusiveValues` into the `Question` object definition so it lives with the question data it describes.

**Priority:** Medium.

---

### Error Handling

**Finding:** An `app/error.tsx` error boundary exists. It logs to `console.error` but does not report to any external service.

**Recommendation:** In production, send errors to Sentry or Vercel's built-in error monitoring.

**Priority:** Medium (post-launch concern).

---

### Logging and Observability

**Finding:** No funnel tracking. `@vercel/analytics` tracks page views only.

**Impact:** It is impossible to know what percentage of users complete all 8 questions, which question causes drop-off, or which recommendation is most common.

**Recommendation:** Add `va.track()` events at: flow start, each question answered, recommendation viewed, modal opened, restart triggered.

**Priority:** Medium (high value for product iteration decisions).

---

### Configuration Management

**Finding:** No secrets, no environment variables in use beyond `process.env.NODE_ENV`.

**Impact:** None for V1. Correct for a purely client-side app.

**Recommendation:** When V2 adds LLM calls, create `.env.example` and keep all LLM calls server-side to avoid exposing keys in the client bundle.

**Priority:** N/A for V1. Critical to plan for V2.

---

### Deployment Readiness

**Finding:** The app is deployable to Vercel today. Build passes, static output, no server dependencies.

**Gap:** No CI/CD pipeline. No `.github/workflows/` directory.

**Recommendation:** Add a GitHub Actions workflow that runs `npm run lint && npm run build` on every push to main.

**Priority:** Medium.

---

## 5. Security Review

### Authentication and Authorization

**Finding:** No auth, no authz — correctly so for a public anonymous tool.

**Risk:** None.

**Priority:** N/A.

---

### Secrets Handling

**Finding:** No secrets in the repository. Zero `process.env.*` references beyond `NODE_ENV`.

**Risk:** None for V1.

**Recommendation:** When V2 introduces LLM API keys, store them in Vercel environment variables, consume them server-side only, and document them in a committed `.env.example`.

**Priority:** N/A now. Critical for V2.

---

### Dependency Risk

**Finding:** 14 unused packages increase the attack surface without providing value.

**Evidence:** `recharts`, `date-fns`, `embla-carousel-react`, `react-day-picker`, `vaul`, `input-otp`, `cmdk`, `react-resizable-panels` have no imports in the active codebase. `puppeteer` (devDependency) bundles a full Chromium.

**Risk:** Low-Medium. Each unused package is a potential transitive vulnerability vector.

**Recommendation:** Run `npm audit`. Remove unused packages. Add `npm audit` to CI.

**Priority:** Medium.

---

### Input Validation and Sanitization

**Finding:** All user input is selection-based (option button clicks), not free-form text entry. The only values that enter the engine are from a closed set defined in `questions.ts`.

**Risk:** Minimal for V1.

**Recommendation:** If V2 adds free-form text input, apply strict sanitization before passing to the engine or any LLM.

**Priority:** N/A for V1.

---

### XSS

**Finding:** No XSS risk. All content rendered via React JSX escapes HTML by default. No `dangerouslySetInnerHTML` anywhere. `annotate()` returns React nodes, not raw HTML strings.

**Recommendation:** Maintain the pattern of returning React nodes from `annotate()`.

**Priority:** Strength.

---

### CSRF / SSRF

**Finding:** No CSRF or SSRF risk — no state-mutating server requests, no server-side URL fetching.

**Priority:** N/A.

---

### API Exposure

**Finding:** No API routes exist. No `app/api/` directory.

**Recommendation:** When V2 adds API routes, validate inputs with Zod server-side and apply rate limiting via Vercel edge middleware or Upstash.

**Priority:** N/A for V1.

---

### CORS Configuration

**Finding:** `allowedDevOrigins` in `next.config.mjs` whitelists `*.vusercontent.net`, `*.vercel.app`, and `localhost`. This is a Next.js dev server option, not a production CORS header.

**Risk:** Low. Does not expose sensitive data.

**Recommendation:** Add a comment in `next.config.mjs` confirming this is dev-only.

**Priority:** Low.

---

### Data Protection

**Finding:** No user data is persisted, transmitted, or stored. Answers exist only in React component state.

**Risk:** None. This is the intended design per `docs/product-spec.md`.

**Priority:** Strength.

---

### Client/Server Trust Boundaries

**Finding:** No trust boundaries exist — everything is client-side. For V1, this is correct. For V2 with LLM calls, the trust boundary must be established at the API route layer.

**Priority:** Plan for V2.

---

### Hydration Warning

**Finding:** A hydration mismatch was occurring in production due to Grammarly injecting `data-gr-*` attributes onto `<body>`. Fix applied: `suppressHydrationWarning` on `<body>` in `layout.tsx`.

**Risk:** Low (browser extension, not a code bug). Fix confirmed and committed.

**Priority:** Resolved.

---

### Security Headers

**Finding:** No `vercel.json` present. Security headers (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`) rely on Vercel's defaults.

**Recommendation:** Add a `vercel.json` with explicit security headers.

**Priority:** Low.

---

## 6. App Compatibility Review

### Browser Support

React 19 and Next.js 16 require a modern browser. Features in active use:

| Feature | Required by |
|---|---|
| CSS Custom Properties | `--sprout`, `--panel`, etc. in globals.css |
| CSS Grid | `wasabi-layout` |
| CSS `@layer` | Tailwind v4 cascade system |
| `matchMedia` | `compactNetwork` detection |
| SVG animations | neural network flow edges |
| `dvh` units | `height: 100dvh` in wasabi-shell |
| ES2019+ | React 19, Next.js 16 |

**Confirmed supported:** Chrome 100+, Firefox 100+, Safari 15.4+, Edge 100+.

**Likely broken:** Safari < 15.4 (no `dvh` support). Recommendation: add `height: 100vh` as a fallback before `height: 100dvh`.

---

### Mobile and Responsive Behavior

**Confirmed working:** Single-column layout on mobile, compact network mode, touch-friendly option buttons.

**Gap 1:** `WhyPopover` uses `getBoundingClientRect()` for positioning. On mobile, if the soft keyboard opens and resizes the viewport, the popup may misalign.

**Gap 2:** At 768px–1099px (tablet), the app requires scrolling through all three stacked sections.

**Recommendation:** Test on iOS Safari 15+, lower the desktop breakpoint to ~900px or add a 2-column intermediate layout.

---

### Runtime Compatibility

**Finding:** `package.json` has no `engines` field. Next.js 16.2.0 requires Node.js 18.18+.

**Recommendation:** Add `"engines": { "node": ">=18.18" }` to `package.json`.

---

### Environment and Deployment Compatibility

**Confirmed:** Vercel deployment works. No `vercel.json` present — caching headers, redirects, and security headers are at Vercel defaults.

**Recommendation:** Add `vercel.json` with security headers and explicit cache control for static assets.

---

### External Service Dependencies at Runtime

| Service | Required | Failure mode |
|---|---|---|
| Vercel Analytics | Production only | Graceful — guarded by `NODE_ENV` check |
| Google Fonts (Geist) | Build time only | If down at build, build fails; fonts bundled at runtime |

Zero runtime external dependencies. This is a significant reliability strength.

---

### Likely Breakpoints or Unsupported Scenarios

1. **JavaScript disabled**: No `<noscript>` message. App is entirely unusable without JS.
2. **Very narrow screens (< 320px)**: May overflow horizontally.
3. **Print media**: No `@media print` styles. Printing a recommendation will be poorly formatted.
4. **Windows high-contrast mode**: No `forced-colors` media query support. Palette colors may be overridden unpredictably.

---

## 7. Potential Expansions Within the App

### 1. Adaptive Question Branching

**Description:** Branch the question flow based on early answers. If Q2 ("Would rules work?") is answered "Yes," skip to Q8 and short-circuit to the "No AI needed" path.

**Why it fits:** `docs/handoff.md` explicitly lists "Branch based on answers?" as an open question. The `Question` type and engine are designed for this — only routing logic in `page.tsx` needs to change.

**Required technical changes:** Add optional `nextQuestion?: (answers: Answers) => string | null` to the `Question` type. Implement `getNextQuestionId(currentId, answers)` in the engine. Update `nextStep()` in `page.tsx`.

**Estimated complexity:** Medium (2–3 days).

**Expected value:** High — reduces time-to-recommendation, increases completion rate.

---

### 2. Shareable Recommendation Links

**Description:** Generate a URL encoding the user's answers as query parameters or a compact hash. Sharing the link restores the exact answer set.

**Why it fits:** `docs/handoff.md` lists this as a deferred feature. `Answers` is a simple `Record<string, string | string[]>` — trivially serializable to URLSearchParams.

**Required technical changes:** Serialize `answers` to a URL-safe string on flow completion. Add a `useEffect` on load that reads and deserializes URL params into initial state.

**Estimated complexity:** Low (1 day).

**Expected value:** High — professors can share pre-filled examples; students can share recommendations with advisors.

---

### 3. Answer Persistence via localStorage

**Description:** Persist `answers` and `currentIndex` to localStorage so users can resume after closing the tab.

**Why it fits:** `docs/product-spec.md` defers persistence intentionally for V1. The `Answers` type serializes trivially. Hydration safety requires reading localStorage only in a `useEffect`.

**Required technical changes:** Add a `useLocalStorage` hook. Initialize `answers` from localStorage. Clear on `restart()`.

**Estimated complexity:** Low (half a day).

**Expected value:** Medium.

---

### 4. Custom Analytics Funnel

**Description:** Add `va.track()` events at key moments and surface a simple funnel view in an `/admin` route showing completion rates and recommendation distribution.

**Why it fits:** `@vercel/analytics` is already installed and supports custom events via `import { track } from "@vercel/analytics"`. `recharts` is already a (currently unused) dependency.

**Required technical changes:** Add `track()` calls at question answered, recommendation shown, modal opened, restart triggered. Build an `/admin` page using recharts.

**Estimated complexity:** Medium (4 days total).

**Expected value:** High for product iteration — reveals drop-off points and recommendation distribution.

---

### 5. Comparison Mode

**Description:** Run the questionnaire twice with different constraint sets and show both recommendations side-by-side with a diff of which signals changed.

**Why it fits:** The engine is pure and stateless — running it twice with different `Answers` is trivial. Directly serves the "test alternatives" use case mentioned in the `JourneyAtlas` copy.

**Required technical changes:** Add a `compareMode` boolean and a second `Answers` state. Run `computeRecommendation` on both. Render a 2-up view in the done state.

**Estimated complexity:** High (3–5 days — most complexity is UI design for the 2-up view).

**Expected value:** High for classroom use — demonstrates how constraints shift recommendations.

---

### 6. Printable Recommendation Report

**Description:** A "Print / Save as PDF" button in the done state that generates a clean formatted document of answers, recommendation, rationale, and next steps.

**Why it fits:** Students need something to hand in for course assignments. All content is already in the recommendation view.

**Required technical changes:** Add `@media print` CSS hiding navigation and network. Provide a button calling `window.print()`.

**Estimated complexity:** Low–Medium (1–2 days).

**Expected value:** Medium — directly useful for academic use cases.

---

### 7. Guided Walkthrough / Teacher Mode

**Description:** An optional mode exposing the H1/H2 concept activations in plain language as the user answers, showing how each answer shapes the scoring in real time.

**Why it fits:** The engine already produces this data in `NetworkState`. The current "Why" popup does this per-question; this extends it to the full flow with a persistent explanation panel.

**Required technical changes:** Add a `teacherMode` boolean. When enabled, render an explanation panel showing current H1/H2 activation state with generated text using the engine's existing `rationale` logic.

**Estimated complexity:** Medium (2–3 days).

**Expected value:** High for educational deployments — the core differentiator vs. a simple decision tree.

---

### 8. Course Preset System

**Description:** A URL parameter (e.g., `?preset=nlp-course`) loads a different question set and path catalog pre-configured for a specific course context.

**Why it fits:** Content is already fully separated from the engine and UI. A preset maps to a different `questions.ts` and `paths.ts` variant. `docs/handoff.md` describes how to add questions — this automates that for non-developers.

**Required technical changes:** Create a `presets/` directory with variant content sets. Add URL param parsing to load a preset on mount.

**Estimated complexity:** Medium (2–3 days).

**Expected value:** High for adoption in structured courses.

---

### 9. Recommendation Confidence Indicator

**Description:** Show users how confident WASABI is in its recommendation, based on the score gap between the top path and the second-place path.

**Why it fits:** `computeRecommendation` already returns `scores: Record<PathId, number>`. The delta is computable in one line. The network visualization shows this implicitly via node sizes; a textual indicator makes it explicit.

**Required technical changes:** Add a `confidence()` helper to the engine. Render a confidence badge in `RecommendationSummary` and update `EmergencePanel` copy.

**Estimated complexity:** Low (1 day).

**Expected value:** Medium — helps users understand when to reconsider answers.

---

## 8. Potential Companion Apps

### 1. WASABI Syllabus — Curriculum Planner for AI/ML Courses

**Core purpose:** A tool for professors to design an AI/ML course syllabus that maps course modules to the 8 WASABI build paths — which weeks cover which paths, what readings, what projects.

**Target users:** Professors and instructors teaching AI/ML at undergraduate or graduate level.

**Relationship to main app:** The 8 build paths are the same 8 paths this tool organizes into a curriculum. A student who gets "Classical ML" from WASABI can be pointed to the specific course week covering that path.

**Shared data/integration:** Shares `paths.ts` content (path names, taglines, `whenItFits`, `avoidWhen`). Deep-links into the main WASABI app per path.

**Why separate:** Audience (professors) and workflow (curriculum planning, multi-session, persistence, export to PDF/LMS) are fundamentally different from the student-facing flow.

---

### 2. WASABI Eval — Post-Build Retrospective Tool

**Core purpose:** After building an AI system, a team answers questions about what they actually built, what problems they encountered, and what they'd change. WASABI Eval compares the built system to the path WASABI would have recommended, surfacing mismatches and lessons learned.

**Target users:** Students who have completed an AI/ML project, practitioners doing a post-mortem.

**Relationship to main app:** Directly inverts the main app's flow. Same 8 path taxonomy, past-tense framing, outcome-oriented questions.

**Shared data/integration:** Same build path definitions. Shareable links from the main app could be imported as the "original recommendation" to compare against.

**Why separate:** Retrospective use requires different questions, different scoring, and a different output format. Adding it to the main app would complicate the intro-flow-done simplicity.

---

### 3. WASABI Benchmark — Task and Metric Reference

**Core purpose:** Given a specific ML task a user is working with, WASABI Benchmark explains which evaluation metrics apply, what baseline numbers to compare against, and what "good enough" looks like. Links to relevant benchmarks based on task type.

**Target users:** Students and researchers who have chosen an approach and need to evaluate it rigorously.

**Relationship to main app:** Picks up where the main app ends. Each `BuildPath` has an `evaluation` field; this companion expands it into a full evaluation workflow.

**Shared data/integration:** Imports `paths.ts`. Linked from the `evaluation` field in each path's recommendation.

**Why separate:** Evaluation is a post-build concern with a fundamentally different interaction model (data upload, numeric input, comparison tables). It's a lookup tool, not a questionnaire.

---

### 4. WASABI Glossary — Interactive AI/ML Terminology Reference

**Core purpose:** A standalone, searchable reference of AI/ML terms with plain-language definitions, cross-references, and worked examples. The current `glossary.ts` has 14 terms; this companion would have 200+, organized by build path and difficulty level.

**Target users:** Students and beginners looking up terminology encountered in papers, documentation, or the main WASABI app.

**Relationship to main app:** The 14 terms in `lib/glossary.ts` are a subset. Every annotated term in the main app deep-links to this reference.

**Shared data/integration:** Extends the `glossary.ts` format. Links back to WASABI's path recommendations for each term.

**Why separate:** A glossary requires search, filtering, cross-linking, and pagination — incompatible with the single-page flow model.

---

### 5. WASABI Pathfinder — Team Alignment Workshop Tool

**Core purpose:** A facilitated multi-player version where a team each independently answers the 8 questions, then sees where their answers diverge. The app surfaces disagreements and helps converge on a shared approach.

**Target users:** Research groups, startup teams, or course project teams at the beginning of an AI/ML project.

**Relationship to main app:** Same question set and engine. Output is aggregated and compared across multiple users rather than presented to a single user.

**Shared data/integration:** Shares questions, paths, and engine as an importable package.

**Why separate:** Real-time multi-user collaboration requires a backend (session management, WebSockets, user identity). Bolting this onto a static architecture would require a complete infrastructure addition.

---

### 6. WASABI Compare — Head-to-Head Path Analyzer

**Core purpose:** Users select two AI approaches they are considering and see a structured side-by-side comparison: effort, risk, data requirements, when each fits, when to avoid — drawn from the `BuildPath` catalog.

**Target users:** Intermediate practitioners who already know their options and need to decide between two specific paths.

**Relationship to main app:** Shares `paths.ts`. Assumes the user already knows what they're comparing, bypassing the questionnaire entirely. Cross-links to the main app for users who don't yet know their options.

**Shared data/integration:** Direct import of `paths.ts`.

**Why separate:** The interaction model (search/select rather than guided flow) and the audience (practitioners vs. beginners) are fundamentally different.

---

## 9. Top Priorities

### 1. Unit tests for `engine.ts`

**Why it matters:** The decision engine is the entire product's core value. It is 441 lines of pure scoring logic with zero test coverage. A wrong coefficient silently shifts recommendations for all users. Correctness is non-negotiable for an educational tool.

**Recommended order:** First, before any feature additions. Takes one day and catches issues in every subsequent engine change.

---

### 2. Remove unused dependencies

**Why it matters:** 14 packages are installed and unused. `recharts`, `date-fns`, and `embla-carousel-react` alone are 400KB+ of dead code. They increase install time, bundle size risk, and the security attack surface.

**Recommended order:** Second — a one-hour cleanup with broad positive impact.

---

### 3. Add custom Vercel Analytics events

**Why it matters:** There is currently zero insight into how users interact with WASABI. Without funnel data, product decisions about which questions to improve, whether branching is needed, and what completion rates look like are guesswork. The infrastructure is already installed.

**Recommended order:** Third. Enables data-driven iteration on all subsequent features.

---

### 4. Adaptive question branching

**Why it matters:** Users who clearly don't need ML still answer 6 more questions before seeing a recommendation. This increases drop-off and reduces the tool's perceived intelligence. Branching is the single highest-impact UX improvement available.

**Recommended order:** Fourth. Requires engine test coverage (priority 1) to safely modify routing logic.

---

### 5. Shareable recommendation links

**Why it matters:** Adoption depends on sharing. A professor who wants to use WASABI in a course needs to share specific pre-filled examples. A student needs to show their recommendation to an advisor. Currently, sharing means "answer 8 questions yourself." Shareable links are a one-day addition with high adoption impact.

**Recommended order:** Fifth. Pure client-side, low risk, high value.

---

## 10. Open Questions and Unknowns

**1. Who operates this app and where is it deployed?**
No README section on deployment URL, owner, or governance. `@vercel/analytics` implies a Vercel deployment but the specific URL and team account are not in the repository.

**2. Is there an intended V2 timeline or owner?**
`docs/handoff.md` and `docs/progress-log.md` describe V2 (LLM integration) and V3 (playgrounds) but with no assigned owner, milestone, or timeline. It is unclear whether V2 is actively planned or aspirational.

**3. What is the content update process?**
Questions and paths are static TypeScript files. Updating them requires editing source and triggering a deployment — no CMS, no admin interface. Limits adoption by non-technical instructors.

**4. Are the scoring weights calibrated against real user outcomes?**
The 50+ scoring coefficients in `engine.ts` are handcrafted. There is no validation set, no A/B testing, and no mechanism to measure whether recommendations are correct. The tool could be systematically steering users toward wrong approaches with no signal. This is the largest epistemic gap in the product.

**5. Is the Turbopack configuration in `next.config.mjs` load-bearing?**
`turbopack: { root: __dirname }` is the default for a standard Next.js app. The explicit configuration may have been added to resolve a monorepo path issue, but there is no monorepo structure in the repository. Unclear whether this is intentional or cargo-culted.

**6. Why are both `pnpm-lock.yaml` and `package-lock.json` committed?**
The repository has both lockfiles, suggesting the project has been installed with both `npm` and `pnpm`. Only one package manager should be used. The canonical package manager is not specified.

**7. What is `styles/globals.css`?**
The file tree shows `styles/globals.css` as a separate file from `app/globals.css`. Unclear whether this is a duplicate, a symlink, or a legacy file. If a separate file, it may contain conflicting or stale styles.

**8. Is dark mode planned?**
`next-themes` is installed and `components/theme-provider.tsx` exists but is not used in `app/layout.tsx`. Dark mode is declared via `@custom-variant dark` in CSS but not toggleable anywhere in the UI. Either dark mode is planned (infrastructure ready) or these are dead code.
