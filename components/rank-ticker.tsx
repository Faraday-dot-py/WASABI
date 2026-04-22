"use client"

/**
 * RankTicker — a quiet ambient readout of the three currently highest-
 * scoring territories. The point is to make the inference legible while
 * the user is still answering: they can watch their choices reshape the
 * ranking in real time. It sits in the top-right of the viewport.
 */

import { useMemo } from "react"
import { PATH_BY_ID } from "@/lib/decision-engine/paths"
import type { PathId, Recommendation } from "@/lib/decision-engine/types"

interface Props {
  recommendation: Recommendation
  hasSignal: boolean
}

export function RankTicker({ recommendation, hasSignal }: Props) {
  const ranked = useMemo(() => {
    const entries = (Object.entries(recommendation.scores) as [PathId, number][])
      .slice()
      .sort((a, b) => b[1] - a[1])
    const max = Math.max(0.0001, ...entries.map(([, v]) => v))
    return entries.slice(0, 3).map(([id, score], i) => ({
      id,
      score,
      normalized: Math.max(0, score / max),
      rank: i,
    }))
  }, [recommendation])

  return (
    <aside
      aria-label="Currently rising territories"
      className="flex w-full max-w-[280px] flex-col gap-2.5 rounded-xl border border-border/70 bg-[color-mix(in_oklch,var(--surface-strong)_70%,transparent)] p-3 backdrop-blur-xl"
    >
      <header className="flex items-center justify-between">
        <span className="font-mono text-[9.5px] uppercase tracking-[0.22em] text-muted-foreground">
          currently rising
        </span>
        <span
          className={[
            "h-1.5 w-1.5 rounded-full transition-colors",
            hasSignal ? "bg-primary atlas-breathe" : "bg-border-strong",
          ].join(" ")}
          aria-hidden="true"
        />
      </header>

      <ol className="flex flex-col gap-1.5">
        {ranked.map((entry, i) => {
          const path = PATH_BY_ID[entry.id]
          const isLeader = i === 0 && hasSignal
          return (
            <li
              key={entry.id}
              className="flex items-center gap-2.5 transition-opacity"
              style={{ opacity: hasSignal ? 1 : 0.55 }}
            >
              <span className="w-4 font-mono text-[10px] tabular-nums text-muted-foreground/70">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <span
                  className={[
                    "truncate text-[11.5px] leading-tight tracking-tight transition-colors",
                    isLeader ? "text-accent" : "text-foreground/85",
                  ].join(" ")}
                >
                  {path.name}
                </span>
                <span
                  aria-hidden="true"
                  className="relative h-[2px] w-full overflow-hidden rounded-full bg-border/60"
                >
                  <span
                    className={[
                      "absolute inset-y-0 left-0 rounded-full transition-[width] duration-700 ease-out",
                      isLeader ? "bg-accent" : "bg-primary/70",
                    ].join(" ")}
                    style={{
                      width: `${Math.round(entry.normalized * 100)}%`,
                    }}
                  />
                </span>
              </div>
            </li>
          )
        })}
      </ol>

      {!hasSignal && (
        <p className="pt-0.5 text-[10.5px] leading-snug text-muted-foreground/70">
          The landscape is flat. Answer any question to start shaping it.
        </p>
      )}
    </aside>
  )
}
