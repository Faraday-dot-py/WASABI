# UX flow

## Stages

```
intro ──▶ flow ──▶ done
  ▲                 │
  └──── restart ────┘
             │
          jump back
             │
             ▼
           flow
```

- `intro` — single hero panel with a clear CTA. The network is already
  alive in ambient mode beside it.
- `flow` — the progress rail is stacked above the current question card.
  Single-select questions auto-advance after a short beat. Multi-select
  questions gate the Next button on at least one selection.
- `done` — recommendation view with a primary path, two alternatives, and
  a path switcher that lets the user inspect any of them without losing
  the recommendation itself.

## Revision

- The progress rail at the top of the flow stage lets the user jump to
  any previous question. Jumping updates state immediately; the network
  animates the change.
- From the `done` stage, "Revise answers" jumps to the last question but
  keeps all answers intact. Submitting advances back to `done`.
- "Start over" clears everything and returns to `intro`.

## Adaptivity in V1

V1 ships a fixed question ordering. Adaptivity is delivered through:

- The network's live interpretation (answers re-weigh outputs in real time).
- Alternatives in the recommendation view, so the user sees the paths
  their choices almost selected.

Branching question paths are a V2 feature (see `handoff.md`).

## Visual language

- Input layer: cyan glow, signals coming in.
- Hidden layers: cyan, with monospaced concept labels to emphasize their
  role as computed signals rather than user input.
- Output layer: amber. The primary output has an amber ring and brighter
  glow.
- Edge flow: cyan-to-amber gradient, stroke-dash animation flowing
  left-to-right to convey "propagation".

## Accessibility

- All option buttons carry `role="radio"` or `role="checkbox"` with
  `aria-checked`.
- The progress rail uses `aria-current="step"`.
- The neural network SVG has an `aria-label` and its animated elements
  are marked `aria-hidden="true"` so screen readers do not read glow or
  edges.
- Color is never the only carrier of meaning: selected options also show
  a check mark, the primary path also carries a ring and a label tag.
