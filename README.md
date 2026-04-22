# W.A.S.A.B.I.

**What AI System Am I Building Into** — an interactive guide that helps
professors and students figure out which AI/ML system they should actually
build into. The user feeds answers into the first layer of a live neural
network and watches the network converge on a recommended path.

This repository contains **V1** of the product: the guided, deterministic,
non-LLM core experience. V2 (LLM-assisted interpretation) and V3 (interactive
model playgrounds) are planned and the architecture has been designed to
accept them without a rewrite.

## What V1 does

- Guides the user through a short, adaptive sequence of questions about their
  goal, data, constraints, and system context.
- Visualizes the decision in real time as a 4-layer neural network. Inputs
  are user answers, hidden layers are human-authored concept detectors, and
  outputs are build-path recommendations.
- Generates a deterministic recommendation, two alternatives, rationale,
  tradeoffs, first prototype, evaluation plan, and next steps.
- Allows the user to revise any earlier answer and watch the network
  re-resolve.

## What V1 deliberately does not do

- No LLM calls. Everything is deterministic and runs in the browser.
- No training workflows or live model demos.
- No freeform natural-language input interpretation.

These are reserved for V2 and V3.

## Stack

- Next.js 16 App Router, React 19
- Tailwind CSS v4
- shadcn/ui primitives (existing in the starter)
- Pure SVG for the network visualization
- Styled-jsx for co-located CSS animations

## Run

```bash
pnpm install
pnpm dev
```

Then open [http://localhost:3000](http://localhost:3000).

## Documentation

The `docs/` folder contains the spec, architecture, decision logic, UX flow,
animation system, progress log, and a handoff note for future contributors.
Start with [`docs/architecture.md`](docs/architecture.md) for a map of the code.
