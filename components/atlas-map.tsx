"use client"

/**
 * The Atlas of Inference — WASABI's living topographic visualization.
 *
 * Conceptually the atlas is a shared landscape where each AI/ML build path
 * is a territory with fixed coordinates. As the user answers questions, the
 * engine emits per-path scores. The atlas interprets those scores as
 * "elevation" and deforms the terrain in real time:
 *
 *   - Soft additive radial gradients wash the ground in warm height light.
 *   - Marching squares trace topographic isolines at fixed elevation
 *     levels. Where two neighbouring territories both rise, their contours
 *     merge visually — the shared cartography the product is about.
 *   - Particles spawn at the "input seeds" along the perimeter (one per
 *     question) and ascend the live gradient, dragging the eye toward the
 *     currently highest ridge. This is the inference-as-current metaphor.
 *   - Territory markers grow with elevation; the current leader carries a
 *     warm terracotta highlight.
 *
 * The canvas is full-bleed in the page and is intentionally the dominant
 * surface — the UI floats above it rather than boxing it in.
 */

import { useEffect, useRef } from "react"
import { PATHS } from "@/lib/decision-engine/paths"
import { QUESTIONS } from "@/lib/decision-engine/questions"
import type { NetworkState, PathId, Recommendation } from "@/lib/decision-engine/types"

// ---------------------------------------------------------------------------
// Map layout — path anchors in normalized map coordinates [-1, 1] x [-1, 1].
// X axis runs from "less AI" (left) to "more orchestrated AI" (right).
// Y axis runs from "built / custom" (bottom) to "borrowed / pretrained" (top).
// This is the conceptual cartography of the product and is stable across
// sessions, so returning users can orient themselves.
// ---------------------------------------------------------------------------

const PATH_ANCHORS: Record<PathId, { x: number; y: number }> = {
  "no-ai":        { x: -0.82, y:  0.18 },
  "classical-ml": { x: -0.52, y: -0.48 },
  "custom-small": { x: -0.08, y: -0.82 },
  "fine-tuning":  { x:  0.38, y: -0.48 },
  "pretrained":   { x: -0.38, y:  0.74 },
  "prompting":    { x:  0.04, y:  0.52 },
  "rag":          { x:  0.5,  y:  0.3  },
  "agentic":      { x:  0.88, y: -0.12 },
}

// Seeds are evenly distributed along the upper arc of the map perimeter, in
// question order. Keeping them on one side leaves the lower half for
// territories and flow lines.
function seedPosition(index: number, total: number): { x: number; y: number } {
  // Arc sweeping from upper-left around the top to upper-right.
  const start = -Math.PI * 1.2
  const end = Math.PI * 0.2
  const t = total <= 1 ? 0.5 : index / (total - 1)
  const angle = start + (end - start) * t
  const r = 1.06
  return { x: Math.cos(angle) * r, y: Math.sin(angle) * r * 0.9 }
}

// ---------------------------------------------------------------------------
// Small numerical helpers.
// ---------------------------------------------------------------------------

const clamp01 = (n: number): number => (n < 0 ? 0 : n > 1 ? 1 : n)

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

// Frame-rate-independent spring toward a target. `k` in (0, 1) per second.
function approach(current: number, target: number, dt: number, k = 6): number {
  const factor = 1 - Math.exp(-k * dt)
  return current + (target - current) * factor
}

// ---------------------------------------------------------------------------
// Field sampling.
//
// F(x, y) = sum over paths p of heights[p] * G(x, y; anchor[p], sigma)
// where G is a Gaussian. The field is the substrate the contour lines trace
// and the flow particles climb.
// ---------------------------------------------------------------------------

const FIELD_SIGMA = 0.42
const TWO_SIGMA_SQ = 2 * FIELD_SIGMA * FIELD_SIGMA

function sampleField(
  x: number,
  y: number,
  heights: Record<PathId, number>,
  ambient: number,
): number {
  let v = ambient
  for (const path of PATHS) {
    const a = PATH_ANCHORS[path.id]
    const dx = x - a.x
    const dy = y - a.y
    v += heights[path.id] * Math.exp(-(dx * dx + dy * dy) / TWO_SIGMA_SQ)
  }
  return v
}

// Analytic gradient of the same field. Used by flow particles to ascend.
function sampleGradient(
  x: number,
  y: number,
  heights: Record<PathId, number>,
  out: { gx: number; gy: number },
): void {
  let gx = 0
  let gy = 0
  for (const path of PATHS) {
    const a = PATH_ANCHORS[path.id]
    const dx = x - a.x
    const dy = y - a.y
    const d2 = dx * dx + dy * dy
    const g = heights[path.id] * Math.exp(-d2 / TWO_SIGMA_SQ)
    // d/dx exp(-d²/2σ²) = exp(...) * (a.x - x) / σ²
    gx += g * (a.x - x) / (FIELD_SIGMA * FIELD_SIGMA)
    gy += g * (a.y - y) / (FIELD_SIGMA * FIELD_SIGMA)
  }
  out.gx = gx
  out.gy = gy
}

// ---------------------------------------------------------------------------
// Marching squares — minimal implementation for our use case.
//
// For a unit cell with corners labeled as:
//   3 ---- 2
//   |      |
//   0 ---- 1
// and a threshold T, we look up which edges the isoline intersects.
// Each entry in the table is a list of edge pairs (each pair is one line
// segment). Edges:
//   0: bottom (corner 0 -> 1)
//   1: right  (corner 1 -> 2)
//   2: top    (corner 2 -> 3)
//   3: left   (corner 3 -> 0)
// ---------------------------------------------------------------------------

const MS_TABLE: number[][][] = [
  [],                  // 0000
  [[3, 0]],            // 0001
  [[0, 1]],            // 0010
  [[3, 1]],            // 0011
  [[1, 2]],            // 0100
  [[3, 2], [1, 0]],    // 0101 (saddle — resolved as two separate segments)
  [[0, 2]],            // 0110
  [[3, 2]],            // 0111
  [[2, 3]],            // 1000
  [[2, 0]],            // 1001
  [[2, 1], [0, 3]],    // 1010 (saddle)
  [[2, 1]],            // 1011
  [[1, 3]],            // 1100
  [[1, 0]],            // 1101
  [[0, 3]],            // 1110
  [],                  // 1111
]

// Interpolate position along a cell edge to where the field crosses `level`.
function edgeCrossing(
  edge: number,
  v: [number, number, number, number],
  level: number,
  cx: number, // cell origin (corner 0) in map coords
  cy: number,
  w: number, // cell width in map coords
  h: number, // cell height in map coords
): [number, number] {
  // Corner positions relative to (cx, cy).
  // 0: (0, 0)   1: (w, 0)   2: (w, h)   3: (0, h)
  let a = 0
  let b = 0
  let ax = 0
  let ay = 0
  let bx = 0
  let by = 0
  switch (edge) {
    case 0: a = v[0]; b = v[1]; ax = 0; ay = 0; bx = w; by = 0; break
    case 1: a = v[1]; b = v[2]; ax = w; ay = 0; bx = w; by = h; break
    case 2: a = v[2]; b = v[3]; ax = w; ay = h; bx = 0; by = h; break
    case 3: a = v[3]; b = v[0]; ax = 0; ay = h; bx = 0; by = 0; break
  }
  const denom = b - a
  const t = Math.abs(denom) < 1e-6 ? 0.5 : (level - a) / denom
  const tt = clamp01(t)
  return [cx + ax + (bx - ax) * tt, cy + ay + (by - ay) * tt]
}

// ---------------------------------------------------------------------------
// Component.
// ---------------------------------------------------------------------------

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  seed: number
  trail: number[] // flat [x0, y0, x1, y1, ...]
}

interface Props {
  state: NetworkState
  recommendation: Recommendation
  answeredQuestionIds: string[]
  reducedMotion?: boolean
}

export function AtlasMap({
  state,
  recommendation,
  answeredQuestionIds,
  reducedMotion = false,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Everything the animation loop needs lives in refs so the loop can run
  // independently of React re-renders.
  const targetHeightsRef = useRef<Record<PathId, number>>(
    Object.fromEntries(PATHS.map((p) => [p.id, 0])) as Record<PathId, number>,
  )
  const displayedHeightsRef = useRef<Record<PathId, number>>(
    Object.fromEntries(PATHS.map((p) => [p.id, 0])) as Record<PathId, number>,
  )
  const seedActiveRef = useRef<number[]>(new Array(QUESTIONS.length).fill(0))
  const seedTargetRef = useRef<number[]>(new Array(QUESTIONS.length).fill(0))
  const leaderRef = useRef<PathId>(recommendation.primary)
  const particlesRef = useRef<Particle[]>([])

  // Sync target state from props into refs on every render.
  useEffect(() => {
    const next = targetHeightsRef.current
    for (const p of PATHS) next[p.id] = state.outputs[p.id] ?? 0

    const seedTargets = seedTargetRef.current
    for (let i = 0; i < QUESTIONS.length; i++) {
      seedTargets[i] = answeredQuestionIds.includes(QUESTIONS[i].id) ? 1 : 0
    }

    leaderRef.current = recommendation.primary
  }, [state, recommendation, answeredQuestionIds])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d", { alpha: true })
    if (!ctx) return

    let width = 0
    let height = 0
    let dpr = Math.max(1, window.devicePixelRatio || 1)
    let lastTime = performance.now()
    let raf = 0
    let spawnAccumulator = 0

    // Map coords [-1, 1] x [-1, 1] → canvas pixel coords.
    // Uses most of the canvas with a small inset so perimeter seeds have room.
    const INSET = 0.06
    const toPx = (x: number, y: number): [number, number] => [
      ((x + 1) / 2) * (1 - INSET * 2) * width + INSET * width,
      ((y + 1) / 2) * (1 - INSET * 2) * height + INSET * height,
    ]

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      width = Math.max(320, Math.floor(rect.width))
      height = Math.max(320, Math.floor(rect.height))
      dpr = Math.max(1, window.devicePixelRatio || 1)
      canvas.width = width * dpr
      canvas.height = height * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    resize()
    const observer = new ResizeObserver(resize)
    observer.observe(canvas)

    // Precompute label positions with a small outward offset from each anchor
    // so text does not land on top of the territory marker.
    function labelOffset(anchor: { x: number; y: number }): [number, number] {
      const len = Math.hypot(anchor.x, anchor.y) || 1
      return [anchor.x / len, anchor.y / len]
    }

    // -----------------------------------------------------------------------
    // Particle management.
    // -----------------------------------------------------------------------
    function spawnParticle(seedIdx: number) {
      const p = seedPosition(seedIdx, QUESTIONS.length)
      // Start slightly inside the seed ring so the particle is "released"
      // toward the centre.
      const sx = p.x * 0.94
      const sy = p.y * 0.94
      particlesRef.current.push({
        x: sx,
        y: sy,
        vx: -sx * 0.02,
        vy: -sy * 0.02,
        life: 1,
        maxLife: 1,
        seed: seedIdx,
        trail: [sx, sy, sx, sy, sx, sy, sx, sy],
      })
    }

    function updateParticles(dt: number) {
      const heights = displayedHeightsRef.current
      const seeds = seedActiveRef.current
      const g = { gx: 0, gy: 0 }
      const list = particlesRef.current
      for (let i = list.length - 1; i >= 0; i--) {
        const part = list[i]
        sampleGradient(part.x, part.y, heights, g)
        // Ascent — move up the hill. Scale by dt for framerate independence.
        part.vx += g.gx * 0.9 * dt
        part.vy += g.gy * 0.9 * dt
        // Soft damping so particles don't shoot past the ridge.
        part.vx *= Math.exp(-1.6 * dt)
        part.vy *= Math.exp(-1.6 * dt)
        // If gradient is effectively zero (no answers yet) drift gently
        // inward so the map never looks static.
        if (Math.hypot(g.gx, g.gy) < 0.02) {
          part.vx += (0 - part.x) * 0.4 * dt
          part.vy += (0 - part.y) * 0.4 * dt
        }
        part.x += part.vx * dt
        part.y += part.vy * dt
        part.life -= dt * (0.28 + 0.04 * seeds[part.seed])

        // Trail: shift values back and write newest at head.
        const tr = part.trail
        for (let k = tr.length - 1; k >= 2; k--) tr[k] = tr[k - 2]
        tr[0] = part.x
        tr[1] = part.y

        // Recycle if dead or out of bounds.
        if (
          part.life <= 0 ||
          part.x < -1.3 ||
          part.x > 1.3 ||
          part.y < -1.3 ||
          part.y > 1.3
        ) {
          list.splice(i, 1)
        }
      }
      // Cap total particles to protect the frame budget.
      if (list.length > 90) list.splice(0, list.length - 90)
    }

    // -----------------------------------------------------------------------
    // Render.
    // -----------------------------------------------------------------------

    // Sample grid for contours. Resolution trades detail for frame budget.
    const GRID_COLS = 48
    const GRID_ROWS = 32
    const field = new Float32Array(GRID_COLS * GRID_ROWS)

    function rebuildField(ambient: number) {
      const heights = displayedHeightsRef.current
      for (let j = 0; j < GRID_ROWS; j++) {
        const y = (j / (GRID_ROWS - 1)) * 2 - 1
        for (let i = 0; i < GRID_COLS; i++) {
          const x = (i / (GRID_COLS - 1)) * 2 - 1
          field[j * GRID_COLS + i] = sampleField(x, y, heights, ambient)
        }
      }
    }

    function drawGround() {
      // Vertical wash from ground to slightly brighter top, then a subtle
      // warm horizon — evokes hour-just-before-dusk atmosphere.
      const grad = ctx.createLinearGradient(0, 0, 0, height)
      grad.addColorStop(0, "oklch(0.19 0.025 150)")
      grad.addColorStop(0.55, "oklch(0.15 0.02 152)")
      grad.addColorStop(1, "oklch(0.12 0.018 155)")
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, width, height)

      // Faint horizon band — the hopeful note in the palette.
      const horizon = ctx.createLinearGradient(0, 0, 0, height)
      horizon.addColorStop(0, "oklch(0.3 0.06 60 / 0.07)")
      horizon.addColorStop(0.5, "transparent")
      horizon.addColorStop(1, "transparent")
      ctx.fillStyle = horizon
      ctx.fillRect(0, 0, width, height)
    }

    function drawHeightWash() {
      // For each path, paint a soft radial gradient sized by its current
      // height. Using `lighter` so overlapping territories brighten additively.
      const heights = displayedHeightsRef.current
      ctx.save()
      ctx.globalCompositeOperation = "lighter"
      for (const p of PATHS) {
        const h = heights[p.id]
        if (h < 0.04) continue
        const anchor = PATH_ANCHORS[p.id]
        const [cx, cy] = toPx(anchor.x, anchor.y)
        const r = Math.max(width, height) * (0.22 + 0.35 * h)
        const isLeader = p.id === leaderRef.current && h > 0.25
        const baseHue = isLeader ? "0.86 0.14 55" : "0.82 0.15 145"
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r)
        grad.addColorStop(0, `oklch(${baseHue} / ${0.28 * h})`)
        grad.addColorStop(0.45, `oklch(${baseHue} / ${0.12 * h})`)
        grad.addColorStop(1, "oklch(0 0 0 / 0)")
        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.arc(cx, cy, r, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.restore()
    }

    function drawContours(levels: number[]) {
      // Cell size in map coords.
      const cellW = 2 / (GRID_COLS - 1)
      const cellH = 2 / (GRID_ROWS - 1)

      for (let li = 0; li < levels.length; li++) {
        const level = levels[li]
        // Fade and thicken based on level — deeper (higher) contours are
        // more emphatic. Outer contours read as "shared low ground" so they
        // get a softer lichen stroke.
        const t = li / (levels.length - 1) // 0 at lowest, 1 at highest
        const alpha = 0.12 + 0.5 * t
        const lineW = 0.6 + 1.0 * t
        const hue = lerp(148, 55, Math.max(0, t - 0.6) * 2.5) // warm only at peak
        ctx.strokeStyle = `oklch(0.82 ${0.08 + 0.07 * t} ${hue} / ${alpha})`
        ctx.lineWidth = lineW

        ctx.beginPath()
        for (let j = 0; j < GRID_ROWS - 1; j++) {
          const y = (j / (GRID_ROWS - 1)) * 2 - 1
          for (let i = 0; i < GRID_COLS - 1; i++) {
            const x = (i / (GRID_COLS - 1)) * 2 - 1
            const v0 = field[j * GRID_COLS + i]
            const v1 = field[j * GRID_COLS + (i + 1)]
            const v2 = field[(j + 1) * GRID_COLS + (i + 1)]
            const v3 = field[(j + 1) * GRID_COLS + i]
            const idx =
              (v0 > level ? 1 : 0) |
              (v1 > level ? 2 : 0) |
              (v2 > level ? 4 : 0) |
              (v3 > level ? 8 : 0)
            const edges = MS_TABLE[idx]
            if (edges.length === 0) continue
            const corners: [number, number, number, number] = [v0, v1, v2, v3]
            for (const [ea, eb] of edges) {
              const [mxA, myA] = edgeCrossing(ea, corners, level, x, y, cellW, cellH)
              const [mxB, myB] = edgeCrossing(eb, corners, level, x, y, cellW, cellH)
              const [pxA, pyA] = toPx(mxA, myA)
              const [pxB, pyB] = toPx(mxB, myB)
              ctx.moveTo(pxA, pyA)
              ctx.lineTo(pxB, pyB)
            }
          }
        }
        ctx.stroke()
      }
    }

    function drawSeeds(time: number) {
      const seeds = seedActiveRef.current
      for (let i = 0; i < QUESTIONS.length; i++) {
        const pos = seedPosition(i, QUESTIONS.length)
        const [cx, cy] = toPx(pos.x, pos.y)
        const a = seeds[i]
        const pulse = 0.5 + 0.5 * Math.sin(time * 0.001 + i * 0.7)
        const r = 3 + 2 * a + 0.8 * pulse * a

        // Halo
        if (a > 0.05) {
          const halo = ctx.createRadialGradient(cx, cy, 0, cx, cy, 18 + 8 * a)
          halo.addColorStop(0, `oklch(0.9 0.12 145 / ${0.35 * a})`)
          halo.addColorStop(1, "oklch(0 0 0 / 0)")
          ctx.fillStyle = halo
          ctx.beginPath()
          ctx.arc(cx, cy, 18 + 8 * a, 0, Math.PI * 2)
          ctx.fill()
        }

        ctx.fillStyle = a > 0.4
          ? "oklch(0.92 0.14 145)"
          : "oklch(0.55 0.06 148 / 0.6)"
        ctx.beginPath()
        ctx.arc(cx, cy, r, 0, Math.PI * 2)
        ctx.fill()

        // Tiny label (question node label) — only when answered.
        if (a > 0.5) {
          const q = QUESTIONS[i]
          const outward = 1 + 0.11
          const [lx, ly] = toPx(pos.x * outward, pos.y * outward)
          ctx.fillStyle = "oklch(0.78 0.04 145 / 0.78)"
          ctx.font = "500 10px var(--font-geist-sans), system-ui, sans-serif"
          ctx.textBaseline = "middle"
          ctx.textAlign = pos.x < -0.2 ? "right" : pos.x > 0.2 ? "left" : "center"
          ctx.fillText(q.nodeLabel, lx, ly)
        }
      }
    }

    function drawTerritories() {
      const heights = displayedHeightsRef.current
      // Sort so the leader renders last (on top).
      const order = [...PATHS].sort(
        (a, b) => heights[a.id] - heights[b.id],
      )
      for (const path of order) {
        const h = heights[path.id]
        const anchor = PATH_ANCHORS[path.id]
        const [cx, cy] = toPx(anchor.x, anchor.y)
        const isLeader = path.id === leaderRef.current && h > 0.2
        const accentHue = isLeader ? "0.86 0.14 55" : "0.85 0.15 145"

        // Outer ring — territory boundary. Fades in with height.
        const ringR = 14 + 32 * h
        ctx.strokeStyle = `oklch(${accentHue} / ${0.15 + 0.4 * h})`
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.arc(cx, cy, ringR, 0, Math.PI * 2)
        ctx.stroke()

        // Inner dot.
        const dotR = 2 + 4 * h
        ctx.fillStyle = isLeader
          ? `oklch(${accentHue})`
          : h > 0.15
            ? `oklch(${accentHue} / 0.95)`
            : "oklch(0.6 0.05 148 / 0.7)"
        ctx.beginPath()
        ctx.arc(cx, cy, dotR, 0, Math.PI * 2)
        ctx.fill()

        // Name — only render for paths that are actually on the map.
        if (h > 0.18) {
          const [ox, oy] = labelOffset(anchor)
          const lx = cx + ox * (ringR + 14)
          const ly = cy + oy * (ringR + 14)
          ctx.font = `${isLeader ? 600 : 500} ${isLeader ? 12 : 11}px var(--font-geist-sans), system-ui, sans-serif`
          ctx.fillStyle = isLeader
            ? "oklch(0.95 0.1 55)"
            : `oklch(0.9 0.04 145 / ${0.5 + 0.4 * h})`
          ctx.textBaseline = "middle"
          ctx.textAlign = ox < -0.35 ? "right" : ox > 0.35 ? "left" : "center"
          ctx.fillText(path.name, lx, ly)

          // Elevation tick.
          if (isLeader) {
            ctx.font = "500 9px var(--font-geist-mono), ui-monospace, monospace"
            ctx.fillStyle = "oklch(0.85 0.08 55 / 0.8)"
            ctx.fillText(
              `elev ${Math.round(h * 100).toString().padStart(2, "0")}`,
              lx,
              ly + 14,
            )
          }
        }
      }
    }

    function drawParticles() {
      const list = particlesRef.current
      ctx.lineCap = "round"
      for (const part of list) {
        const tr = part.trail
        const lifeFrac = clamp01(part.life / part.maxLife)
        // Trail stroke — tapered by life.
        ctx.strokeStyle = `oklch(0.92 0.1 145 / ${0.35 * lifeFrac})`
        ctx.lineWidth = 1.2
        ctx.beginPath()
        for (let k = 0; k < tr.length; k += 2) {
          const [px, py] = toPx(tr[k], tr[k + 1])
          if (k === 0) ctx.moveTo(px, py)
          else ctx.lineTo(px, py)
        }
        ctx.stroke()

        // Head.
        const [hx, hy] = toPx(part.x, part.y)
        ctx.fillStyle = `oklch(0.95 0.1 145 / ${0.85 * lifeFrac})`
        ctx.beginPath()
        ctx.arc(hx, hy, 1.6, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    // -----------------------------------------------------------------------
    // Main tick.
    // -----------------------------------------------------------------------
    const tick = (t: number) => {
      const rawDt = (t - lastTime) / 1000
      const dt = Math.min(0.05, rawDt) // clamp to handle tab throttling
      lastTime = t

      // Spring displayed heights toward targets.
      const disp = displayedHeightsRef.current
      const tgt = targetHeightsRef.current
      const k = reducedMotion ? 14 : 5
      for (const p of PATHS) {
        disp[p.id] = approach(disp[p.id], tgt[p.id], dt, k)
      }

      // Seeds likewise.
      const sd = seedActiveRef.current
      const st = seedTargetRef.current
      for (let i = 0; i < sd.length; i++) {
        sd[i] = approach(sd[i], st[i], dt, 6)
      }

      // Spawn new particles from active seeds. Rate scales with activation.
      spawnAccumulator += dt
      while (spawnAccumulator > 0.08) {
        spawnAccumulator -= 0.08
        for (let i = 0; i < sd.length; i++) {
          if (sd[i] > 0.4 && Math.random() < 0.22 * sd[i]) spawnParticle(i)
        }
      }

      updateParticles(dt)

      // Ambient so the map is never visually dead.
      const anyActive = Object.values(disp).some((v) => v > 0.1)
      const ambient = anyActive ? 0 : 0.04 + 0.02 * Math.sin(t * 0.0006)
      rebuildField(ambient)

      // Clear and draw.
      ctx.clearRect(0, 0, width, height)
      drawGround()
      drawHeightWash()

      // Contour levels — breathe slowly over time for the "living" feel.
      const breath = reducedMotion ? 0 : Math.sin(t * 0.0004) * 0.015
      drawContours([
        0.1 + breath,
        0.22 + breath,
        0.36 + breath,
        0.52 + breath,
        0.68 + breath,
        0.84 + breath,
      ])

      drawParticles()
      drawTerritories()
      drawSeeds(t)

      raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      observer.disconnect()
    }
  }, [reducedMotion])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="h-full w-full"
      style={{ display: "block" }}
    />
  )
}
