# Architecture

The codebase is organized around four isolated concerns: **content**,
**logic**, **visualization**, and **UI**. Each concern can change without
forcing changes in the others.

```
app/
  layout.tsx                 root layout, font + theme
  page.tsx                   orchestrator: state, stages, layout
  globals.css                palette + motion-friendly tweaks

lib/decision-engine/
  types.ts                   shared types (Question, Answers, Path, NetworkState)
  questions.ts               content: question catalog (input layer)
  paths.ts                   content: build path catalog (output layer)
  engine.ts                  logic: scoring + network activations + recommendation

components/
  neural-network.tsx         visualization: SVG nodes, edges, flow, glow
  question-card.tsx          UI: a single question
  progress-rail.tsx          UI: step-by-step progress + jump-back
  recommendation-view.tsx    UI: final output panel
```

## Data flow

```
user action
   │
   ▼
answers  (Record<string, value>)
   │
   ├──► computeNetworkState(answers) ──► NeuralNetwork (visual)
   │
   └──► computeRecommendation(answers) ──► RecommendationView (text)
```

`computeNetworkState` and `computeRecommendation` share the same scoring
functions internally so the network and the recommendation **cannot
disagree**. This is what lets the visualization feel honest.

## Key architectural choices

### 1. Answers are the single source of truth

The only mutable state is `answers` (plus UI bookkeeping: current step,
stage). Everything else is derived via `useMemo`. This makes revision,
branching, and replay trivially correct.

### 2. Visualization is derived, not animated imperatively

Every frame of the network is a pure function of `answers`. Animations
(signal flow, glow, breathing) are CSS-based and driven by the current
state, not by hand-authored timelines. This keeps the metaphor tied to
the actual decision state.

### 3. Hidden concepts are human-authored

The "hidden" layers are not learned weights. They are explicit concept
detectors named `Structured`, `Language`, `Generative`, `Data-thin`,
`Constrained`, `Grounded` (and then `Lean`, `Classical`, `Pretrained`,
`Retrieval`, `Adapt`, `Orchestrate`). This lets a non-ML reader audit
the logic in minutes.

### 4. Extensibility hooks for V2 / V3

`lib/decision-engine/engine.ts` exposes an `EngineHooks` interface with
optional `interpretFreeformInput` and `personalizeRationale` methods.
These are no-ops in V1. V2 can implement them with LLM calls without
touching the rest of the system.

### 5. Content is data, not JSX

All questions, options, paths, rationales, and cautions live as plain
objects in `questions.ts` and `paths.ts`. A content editor can adjust
copy without reading any React.

## What a V2 / V3 contribution looks like

- **V2 (LLM interpretation):** implement `interpretFreeformInput` in a new
  file; wire a text input in `components/question-card.tsx` that calls
  it and merges the resulting partial `Answers` into state.
- **V2 (personalized rationale):** implement `personalizeRationale` and
  optionally render streamed output in `recommendation-view.tsx` beside
  the deterministic rationale.
- **V3 (model playgrounds):** add a new route under `app/playgrounds/` and
  let the recommendation view deep-link to a playground preloaded with
  the user's answers.

None of these require changing the decision engine's core signatures.
