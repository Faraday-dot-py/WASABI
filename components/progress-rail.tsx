"use client"

import { QUESTIONS } from "@/lib/decision-engine/questions"
import type { Answers } from "@/lib/decision-engine/types"
import { cn } from "@/lib/utils"

interface ProgressRailProps {
  currentIndex: number
  answers: Answers
  onJump: (index: number) => void
}

export function ProgressRail({
  currentIndex,
  answers,
  onJump,
}: ProgressRailProps) {
  return (
    <div className="wasabi-panel px-4 py-4">
      <div className="mb-4 flex items-center gap-3">
        <span className="section-kicker">Knowledge path</span>
        <div className="h-px flex-1 bg-[linear-gradient(90deg,var(--line-strong),transparent)]" />
      </div>

      <ol className="relative flex flex-col gap-2">
        <span className="absolute bottom-2 left-[0.9rem] top-2 w-px bg-[linear-gradient(180deg,var(--line-strong),transparent)]" />
        {QUESTIONS.map((question, index) => {
          const value = answers[question.id]
          const answered = Array.isArray(value)
            ? value.length > 0
            : value !== undefined
          const current = index === currentIndex

          return (
            <li key={question.id}>
              <button
                type="button"
                onClick={() => onJump(index)}
                className={cn(
                  "relative flex w-full items-start gap-3 rounded-[1rem] px-2 py-2 text-left transition-colors",
                  current
                    ? "bg-white/65"
                    : "hover:bg-white/40",
                )}
                aria-current={current ? "step" : undefined}
              >
                <span
                  className={cn(
                    "relative z-10 mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[10px] font-medium transition-all",
                    current
                      ? "border-[var(--sprout-strong)] bg-[var(--sprout-soft)] text-[var(--sprout-deep)]"
                      : answered
                        ? "border-[var(--sprout)] bg-[var(--sprout-soft)] text-[var(--sprout-deep)]"
                        : "border-[var(--line-soft)] bg-[var(--panel)] text-muted-foreground",
                  )}
                >
                  {answered ? "•" : index + 1}
                </span>

                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                    {question.nodeLabel}
                  </span>
                  <span className="text-[12.5px] leading-snug text-foreground">
                    {question.title}
                  </span>
                </span>
              </button>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
