"use client"

/**
 * Trail — the left-edge vertical progress indicator.
 *
 * Each answered question becomes a luminous node on a vertical thread. The
 * current question has a pulsing halo; future questions are muted lichen
 * dots. Clicking an answered node jumps back to that question so the user
 * can revise. This replaces the horizontal ProgressRail and is meant to
 * feel like a walking trail on the side of the atlas.
 */

import type { Answers, Question } from "@/lib/decision-engine/types"

interface Props {
  questions: Question[]
  answers: Answers
  currentIndex: number
  onJump: (index: number) => void
  complete: boolean
}

export function Trail({ questions, answers, currentIndex, onJump, complete }: Props) {
  return (
    <nav
      aria-label="Inquiry trail"
      className="flex h-full flex-col items-start gap-4 pl-1 pr-3"
    >
      <header className="flex flex-col gap-1 pb-2">
        <span className="font-mono text-[9.5px] uppercase tracking-[0.22em] text-muted-foreground/80">
          trail
        </span>
        <span className="text-[10.5px] text-muted-foreground/70">
          {complete
            ? "settled"
            : `${Math.min(currentIndex, questions.length)}/${questions.length}`}
        </span>
      </header>

      <ol className="relative flex flex-1 flex-col gap-3">
        {/* Vertical thread connecting the nodes. */}
        <div
          aria-hidden="true"
          className="absolute left-[5px] top-1 bottom-1 w-px bg-gradient-to-b from-transparent via-border-strong/60 to-transparent"
        />
        {questions.map((q, i) => {
          const answered = answers[q.id] !== undefined && answers[q.id] !== ""
          const isCurrent = !complete && i === currentIndex
          const isFuture = !answered && !isCurrent
          return (
            <li key={q.id} className="relative">
              <button
                type="button"
                onClick={() => onJump(i)}
                disabled={isFuture}
                aria-current={isCurrent ? "step" : undefined}
                className={[
                  "group flex items-center gap-3 rounded-full py-0.5 pl-0 pr-2 text-left transition-colors",
                  isFuture ? "cursor-not-allowed" : "cursor-pointer",
                ].join(" ")}
              >
                <span
                  aria-hidden="true"
                  className={[
                    "relative flex h-[11px] w-[11px] shrink-0 items-center justify-center rounded-full border transition-all",
                    isCurrent
                      ? "border-primary/70 bg-primary/40 shadow-[0_0_0_3px_oklch(0.82_0.15_145/0.2),_0_0_14px_oklch(0.82_0.15_145/0.6)]"
                      : answered
                        ? "border-primary/50 bg-primary/80"
                        : "border-border-strong/70 bg-surface",
                  ].join(" ")}
                >
                  {/* Breathing halo on the current node. */}
                  {isCurrent && (
                    <span className="absolute inset-[-3px] rounded-full border border-primary/30 atlas-breathe" />
                  )}
                </span>
                <span
                  className={[
                    "font-mono text-[10.5px] uppercase tracking-[0.18em] transition-colors",
                    isCurrent
                      ? "text-foreground"
                      : answered
                        ? "text-muted-foreground group-hover:text-foreground"
                        : "text-muted-foreground/45",
                  ].join(" ")}
                >
                  {q.nodeLabel}
                </span>
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
