"use client"

import { useMemo } from "react"
import { HIDDEN_1, HIDDEN_2 } from "@/lib/decision-engine/engine"
import { QUESTIONS } from "@/lib/decision-engine/questions"
import { PATHS } from "@/lib/decision-engine/paths"
import type { NetworkState, PathId } from "@/lib/decision-engine/types"
import { cn } from "@/lib/utils"

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------

const VIEW_W = 1200
const VIEW_H = 760

const LAYER_X = {
  input: 210,
  h1: 490,
  h2: 770,
  output: 1040,
}

function layerY(i: number, count: number, top: number, bottom: number) {
  if (count === 1) return (top + bottom) / 2
  const step = (bottom - top) / (count - 1)
  return top + step * i
}

interface Node {
  id: string
  x: number
  y: number
  label: string
  activation: number
  layer: "input" | "h1" | "h2" | "output"
  highlighted?: boolean
  pathId?: PathId
}

interface Edge {
  from: Node
  to: Node
  strength: number // [0, 1]
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface NeuralNetworkProps {
  state: NetworkState
  activeQuestionId: string | null
  primary: PathId | null
  alternatives: PathId[]
  className?: string
  compact?: boolean
}

export function NeuralNetwork({
  state,
  activeQuestionId,
  primary,
  alternatives,
  className,
  compact = false,
}: NeuralNetworkProps) {
  const { nodes, edges } = useMemo(() => {
    const inputs: Node[] = QUESTIONS.map((q, i) => ({
      id: `in:${q.id}`,
      x: LAYER_X.input,
      y: layerY(i, QUESTIONS.length, 60, VIEW_H - 60),
      label: q.nodeLabel,
      activation: state.inputs[q.id] ?? 0,
      layer: "input" as const,
      highlighted: q.id === activeQuestionId,
    }))

    const h1: Node[] = HIDDEN_1.map((c, i) => ({
      id: `h1:${c.id}`,
      x: LAYER_X.h1,
      y: layerY(i, HIDDEN_1.length, 120, VIEW_H - 120),
      label: c.label,
      activation: state.hidden1[c.id] ?? 0,
      layer: "h1" as const,
    }))

    const h2: Node[] = HIDDEN_2.map((c, i) => ({
      id: `h2:${c.id}`,
      x: LAYER_X.h2,
      y: layerY(i, HIDDEN_2.length, 120, VIEW_H - 120),
      label: c.label,
      activation: state.hidden2[c.id] ?? 0,
      layer: "h2" as const,
    }))

    const outputs: Node[] = PATHS.map((p, i) => ({
      id: `out:${p.id}`,
      x: LAYER_X.output,
      y: layerY(i, PATHS.length, 60, VIEW_H - 60),
      label: p.name,
      activation: state.outputs[p.id] ?? 0,
      layer: "output" as const,
      highlighted: primary === p.id,
      pathId: p.id,
    }))

    // All-to-all edges between consecutive layers.
    const edges: Edge[] = []
    const connect = (a: Node[], b: Node[]) => {
      for (const from of a) {
        for (const to of b) {
          // Visual strength = geometric mean of endpoint activations.
          const strength = Math.sqrt(
            Math.max(0, from.activation) * Math.max(0, to.activation),
          )
          edges.push({ from, to, strength })
        }
      }
    }
    connect(inputs, h1)
    connect(h1, h2)
    connect(h2, outputs)

    return { nodes: [...inputs, ...h1, ...h2, ...outputs], edges }
  }, [state, activeQuestionId, primary])

  return (
    <div className={cn("relative h-full w-full", className)}>
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        preserveAspectRatio="xMidYMid meet"
        className="h-full w-full"
        role="img"
        aria-label="Live neural network visualization reflecting your decisions"
      >
        <defs>
          <radialGradient id="node-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="oklch(0.92 0.18 135)" stopOpacity="0.9" />
            <stop offset="60%" stopColor="oklch(0.75 0.18 135)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="oklch(0.75 0.18 135)" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="node-glow-output" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="oklch(0.92 0.15 55)" stopOpacity="0.95" />
            <stop offset="60%" stopColor="oklch(0.82 0.14 55)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="oklch(0.82 0.14 55)" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="edge-base" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="oklch(0.55 0.1 140)" stopOpacity="0.25" />
            <stop offset="100%" stopColor="oklch(0.55 0.1 140)" stopOpacity="0.25" />
          </linearGradient>
          <linearGradient id="edge-active" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="oklch(0.85 0.17 135)" stopOpacity="0.9" />
            <stop offset="100%" stopColor="oklch(0.88 0.14 55)" stopOpacity="0.9" />
          </linearGradient>
          <filter id="soft-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Layer columns as subtle vertical rails */}
        {(["input", "h1", "h2", "output"] as const).map((k) => (
          <line
            key={k}
            x1={LAYER_X[k]}
            x2={LAYER_X[k]}
            y1={30}
            y2={VIEW_H - 30}
            stroke="oklch(0.3 0.02 150)"
            strokeOpacity="0.15"
            strokeWidth="1"
            strokeDasharray="2 8"
          />
        ))}

        {/* Edges - base (always visible faintly) */}
        <g aria-hidden="true">
          {edges.map((e, i) => (
            <line
              key={`base-${i}`}
              x1={e.from.x}
              y1={e.from.y}
              x2={e.to.x}
              y2={e.to.y}
              stroke="oklch(0.55 0.08 140)"
              strokeOpacity={0.06 + e.strength * 0.08}
              strokeWidth={0.6}
            />
          ))}
        </g>

        {/* Edges - active signal flow */}
        <g aria-hidden="true">
          {edges
            .filter((e) => e.strength > 0.12)
            .map((e, i) => {
              const opacity = Math.min(0.85, 0.2 + e.strength * 0.9)
              const width = 0.6 + e.strength * 1.8
              return (
                <line
                  key={`flow-${i}`}
                  x1={e.from.x}
                  y1={e.from.y}
                  x2={e.to.x}
                  y2={e.to.y}
                  stroke="url(#edge-active)"
                  strokeOpacity={opacity}
                  strokeWidth={width}
                  strokeLinecap="round"
                  className="nn-edge-flow"
                  style={
                    {
                      // deterministic stagger so flows feel alive but not chaotic
                      animationDelay: `${(i % 17) * 0.18}s`,
                      animationDuration: `${2.4 + ((i * 31) % 13) * 0.12}s`,
                    } as React.CSSProperties
                  }
                />
              )
            })}
        </g>

        {/* Nodes */}
        <g>
          {nodes.map((n) => (
            <NetworkNode key={n.id} node={n} compact={compact} primary={primary} alternatives={alternatives} />
          ))}
        </g>

        {/* Layer captions */}
        <g
          className="select-none"
          style={{ fontFamily: "var(--font-mono, ui-monospace, monospace)" }}
        >
          <LayerCaption x={LAYER_X.input} label="INPUTS" subtitle="your answers" />
          <LayerCaption x={LAYER_X.h1} label="SIGNALS" subtitle="what we detect" />
          <LayerCaption x={LAYER_X.h2} label="APPROACH" subtitle="model families" />
          <LayerCaption x={LAYER_X.output} label="PATHS" subtitle="recommended build" />
        </g>
      </svg>

      <style jsx>{`
        :global(.nn-edge-flow) {
          stroke-dasharray: 4 10;
          animation-name: nn-flow;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }
        @keyframes nn-flow {
          from {
            stroke-dashoffset: 0;
          }
          to {
            stroke-dashoffset: -28;
          }
        }
        :global(.nn-node-breathe) {
          animation: nn-breathe 3.6s ease-in-out infinite;
          transform-box: fill-box;
          transform-origin: center;
        }
        @keyframes nn-breathe {
          0%,
          100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.08);
          }
        }
      `}</style>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Individual node
// ---------------------------------------------------------------------------

function NetworkNode({
  node,
  compact,
  primary,
  alternatives,
}: {
  node: Node
  compact: boolean
  primary: PathId | null
  alternatives: PathId[]
}) {
  const a = node.activation
  const isOutput = node.layer === "output"
  const isPrimary = isOutput && node.pathId === primary
  const isAlt = isOutput && node.pathId && alternatives.includes(node.pathId)

  // Node radius: scale with activation.
  const baseR = node.layer === "input" || node.layer === "output" ? 7 : 6
  const r = baseR + a * (node.layer === "output" ? 7 : 5)
  const glowR = 18 + a * (isPrimary ? 44 : 24)

  const fillOpacity = 0.25 + a * 0.75
  const isActive = a > 0.15

  const glow = isOutput ? "url(#node-glow-output)" : "url(#node-glow)"
  const strokeColor = isOutput
        ? "oklch(0.88 0.15 55)"
    : node.highlighted
        ? "oklch(0.95 0.05 135)"
        : "oklch(0.8 0.14 135)"

  const labelX =
    node.layer === "input"
      ? node.x - 18
      : node.layer === "output"
        ? node.x + 18
        : node.x
  const labelY =
    node.layer === "h1" || node.layer === "h2" ? node.y - r - 10 : node.y + 4
  const anchor =
    node.layer === "input" ? "end" : node.layer === "output" ? "start" : "middle"

  return (
    <g>
      {/* Glow halo */}
      {isActive && (
        <circle
          cx={node.x}
          cy={node.y}
          r={glowR}
          fill={glow}
          opacity={0.55 + a * 0.45}
          className={isActive ? "nn-node-breathe" : undefined}
        />
      )}

      {/* Primary output ring */}
      {isPrimary && (
        <circle
          cx={node.x}
          cy={node.y}
          r={r + 10}
          fill="none"
          stroke="oklch(0.92 0.15 55)"
          strokeOpacity="0.7"
          strokeWidth={1.2}
        />
      )}
      {isAlt && (
        <circle
          cx={node.x}
          cy={node.y}
          r={r + 6}
          fill="none"
          stroke="oklch(0.85 0.1 55)"
          strokeOpacity="0.35"
          strokeWidth={1}
          strokeDasharray="2 3"
        />
      )}

      {/* Core node */}
      <circle
        cx={node.x}
        cy={node.y}
        r={r}
        fill={
          isOutput
        ? `oklch(0.82 0.14 55 / ${fillOpacity})`
        : `oklch(0.82 0.17 135 / ${fillOpacity})`
        }
        stroke={strokeColor}
        strokeOpacity={0.6 + a * 0.4}
        strokeWidth={node.highlighted || isPrimary ? 1.8 : 1}
        style={{
          transition: "r 500ms cubic-bezier(0.22, 1, 0.36, 1), fill 400ms ease, stroke 400ms ease",
        }}
        filter={isActive ? "url(#soft-glow)" : undefined}
      />

      {/* Label */}
      {!compact && (
        <text
          x={labelX}
          y={labelY}
          textAnchor={anchor}
          fill={
            isPrimary
              ? "oklch(0.95 0.08 55)"
              : node.highlighted
        ? "oklch(0.95 0.03 135)"
        : "oklch(0.72 0.02 150)"
          }
          fontSize={node.layer === "input" || node.layer === "output" ? 13 : 11}
          fontWeight={isPrimary || node.highlighted ? 600 : 400}
          style={{
            fontFamily:
              node.layer === "h1" || node.layer === "h2"
                ? "var(--font-mono, ui-monospace, monospace)"
                : "inherit",
            letterSpacing: node.layer === "h1" || node.layer === "h2" ? "0.04em" : undefined,
            textTransform: node.layer === "h1" || node.layer === "h2" ? "uppercase" : undefined,
            transition: "fill 300ms ease, font-weight 300ms ease",
          }}
        >
          {node.label}
        </text>
      )}
    </g>
  )
}

function LayerCaption({
  x,
  label,
  subtitle,
}: {
  x: number
  label: string
  subtitle: string
}) {
  return (
    <g>
      <text
        x={x}
        y={18}
        textAnchor="middle"
        fill="oklch(0.68 0.04 150)"
        fontSize="10"
        letterSpacing="0.22em"
      >
        {label}
      </text>
      <text
        x={x}
        y={VIEW_H - 10}
        textAnchor="middle"
        fill="oklch(0.55 0.02 150)"
        fontSize="10"
        fontStyle="italic"
      >
        {subtitle}
      </text>
    </g>
  )
}
