# Product specification — V1

## Purpose

Help professors, students, and researchers across many disciplines answer:

- Do I actually need AI or ML for this?
- If I do, what approach fits my goal, my data, and my constraints?
- What should my first prototype look like?
- How should I evaluate it?
- What are the tradeoffs I am implicitly accepting?

The product is an interactive web experience. It replaces a static decision
matrix with a fluid, guided, adaptive conversation surfaced through a live
neural-network visualization.

## Audience

- Professors designing projects, courses, or research programs.
- Students exploring where to start.
- Mixed technical backgrounds, including absolute beginners and researchers
  whose technical skills are outside ML.

## Primary success criterion

A user can move through the experience, feel like they are shaping a live
computational process, receive a clear recommendation grounded in their
answers, and understand concrete next steps.

## Core experience

1. A short intake flow (8 steps) covering goal, necessity, modality, data
   readiness, labels, constraints, system needs, and stage.
2. A live neural-network visualization that always reflects the user's
   current state — inputs light up, intermediate concepts resolve,
   candidate paths converge.
3. A recommendation view with a primary path, two alternatives, rationale,
   tradeoffs, prototype plan, evaluation plan, next steps, and cautions.
4. Free revision: the user can jump back to any question and see the
   recommendation and network update instantly.

## Non-goals for V1

- No LLM calls, no chat, no freeform interpretation.
- No training workflows, no real model playgrounds.
- No multi-user, no persistence, no auth.

## Design principles

- **Intuitive over technical.** The neural-network metaphor is visual,
  not a quiz about neural networks.
- **Honest visualization.** The network reflects actual decision state.
  Nothing is decorative-only.
- **Deterministic core.** Recommendations come from readable scoring rules,
  not learned weights. V2 can add learned or LLM-generated rationale on top.
- **Always extendable.** Each layer (content, logic, visualization, UI)
  is isolated so V2 and V3 can extend without rewrites.

## Versioning

- **V1 (this release):** deterministic guided flow + live network +
  recommendation. No LLM.
- **V2 (planned):** LLM-assisted interpretation of freeform input,
  personalized rationale, conversational revision.
- **V3 (planned):** interactive learning modules and safe model-like demos
  that the user can experiment with.
