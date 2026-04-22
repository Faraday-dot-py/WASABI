# Animation system

## Philosophy

Motion in Neuralpath serves comprehension, not decoration. Three rules:

1. **Every animation must reflect state.** If nothing happened in the
   decision engine, the frame must not change meaningfully.
2. **Motion carries the cause-and-effect of decisions.** Answering a
   question should produce a visible ripple: an input node brightens, a
   concept firms up, an output converges.
3. **Ambient motion stays quiet.** Idle animation exists only to signal
   "the system is alive", never to compete with the active signal.

## Layers of motion

### 1. Ambient (always-on)

- Subtle radial gradients in the background.
- Slow pulse on the "awaiting input" indicator in the legend.
- Low-opacity dashed layer rails behind the network columns.

### 2. State-driven transitions

Driven by React re-renders of the network with new activation values:

- Node radius transitions over 500ms with an ease-out cubic.
- Node fill color and stroke interpolate via CSS transition over 400ms.
- Glow opacity scales with activation; inactive nodes have no glow.

Because activations are pure functions of `answers`, these transitions
happen for free every time the user answers or revises.

### 3. Signal flow

Active edges (endpoints both have activation) get a flowing dash pattern:

```css
.nn-edge-flow {
  stroke-dasharray: 4 10;
  animation: nn-flow 2.4s linear infinite;
}
@keyframes nn-flow {
  from { stroke-dashoffset: 0; }
  to   { stroke-dashoffset: -28; }
}
```

The `animation-delay` and `animation-duration` on each edge are seeded
from its index so the flows feel alive but not chaotic. Inactive edges
stay as flat, low-opacity lines so the overall structure remains
visible.

### 4. Node breathing

Active nodes (activation > threshold) get a gentle `transform: scale()`
breath. This is decorative but subtle, and only applies to nodes that
are actually carrying signal.

### 5. Enter / exit for panels

Question cards and the recommendation view use `tw-animate-css` utility
classes (`animate-in fade-in slide-in-from-bottom-*`) keyed on React's
`key` prop to trigger a crisp mount animation when changing steps or
switching paths.

## Constraints

- Pure CSS / SVG. No WebGL, no canvas, no heavy animation library in V1
  to keep the surface small and the metaphor portable.
- All animations respect `prefers-reduced-motion` because they are
  CSS-based; add a global rule in `globals.css` if stricter behavior is
  desired.

## Extension

V2 and V3 can layer motion without rewrites:

- A "signal pulse" that travels along edges when a new answer lands can
  be added by rendering a small moving circle with `<animateMotion>` keyed
  on the answered question id.
- A "mode switch" animation when jumping between V3 playgrounds can reuse
  the existing enter / exit pattern.
