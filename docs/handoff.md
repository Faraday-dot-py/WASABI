# Handoff notes

If you are picking this project up, start here.

## 5-minute map

1. Read `docs/architecture.md` for the file layout.
2. Skim `lib/decision-engine/questions.ts` and `lib/decision-engine/paths.ts`
   to see the full content.
3. Open `lib/decision-engine/engine.ts` and scroll through
   `computeHidden1`, `computeHidden2`, and `computePathScores`. These three
   functions are the entire decision logic.
4. Open `components/neural-network.tsx`. The `NeuralNetwork` component is a
   pure function of `state`, `activeQuestionId`, and `primary`.
5. Open `app/page.tsx`. This is the only file with mutable state.

## Common tasks

### Change a question's copy

Edit the entry in `lib/decision-engine/questions.ts`. Nothing else needs to
change.

### Add a question

1. Append a `Question` object to `QUESTIONS` in `questions.ts`.
2. In `engine.ts`, add rules that read the new question in
   `computeHidden1` / `computeHidden2` / `computePathScores`.
3. That's it. The network grows a new input node automatically.

### Add a build path

1. Append a `BuildPath` object to `PATHS` in `paths.ts` (including
   `firstPrototype`, `evaluation`, `nextSteps`).
2. Add the new path's id to the initial zeros in `computePathScores` and
   give it scoring rules.
3. The network grows a new output node automatically.

### Tune a recommendation that feels off

1. Reproduce the persona in the live site. Note which signals they touch.
2. Inspect those signals in `engine.ts` and adjust the `+=` / `-=` values.
3. Re-test the persona and two adjacent personas to check for regressions.

### V2: add freeform input

1. Implement `EngineHooks.interpretFreeformInput` in a new file under
   `lib/decision-engine/` (e.g. `engine-llm.ts`). It takes a user string and
   returns a `Partial<Answers>`.
2. Add a text input to `components/question-card.tsx` (or a dedicated
   "freeform intake" step) that calls the hook and merges the partial
   answers into state. Because all state flows through `answers`, the
   network and recommendation will update automatically.

### V2: personalize rationale

1. Implement `EngineHooks.personalizeRationale`. It receives the current
   `Recommendation` and `Answers` and returns an array of strings.
2. In `components/recommendation-view.tsx`, render its output next to the
   existing deterministic rationale, with a clear "personalized" badge so
   users can tell them apart.

### V3: add a playground

1. Create a new route under `app/playgrounds/[id]/page.tsx`.
2. Add a "Try it" button to the recommendation view that deep-links with
   the current primary path as the route segment.
3. The playground can read the user's `answers` from URL state or a
   lightweight client store; the engine is already side-effect-free.

## Things to avoid

- Don't couple the visualization to DOM measurements or animation
  libraries. The current approach — SVG + CSS + derived state — is what
  keeps the metaphor honest.
- Don't replace the deterministic recommendation with an LLM call. Keep
  the deterministic layer and add LLM output beside it.
- Don't let the hidden layers drift into "just visual noise". If an edge
  or concept stops corresponding to a real signal, either fix the
  mapping or delete the edge.

## Open questions worth revisiting

- Should questions branch based on earlier answers? V2 is the right time
  to try this, starting with necessity → goal shortcuts.
- Should we persist answers in `localStorage` so a professor can come
  back? Trivial to add, deliberately skipped for V1.
- Should evaluation advice become a standalone lens, independent of the
  chosen path? A candidate V3 addition.
