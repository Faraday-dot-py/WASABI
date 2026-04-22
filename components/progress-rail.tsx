"use client"

import { QUESTIONS } from "@/lib/decision-engine/questions"
import type { Answers } from "@/lib/decision-engine/types"
import { cn } from "@/lib/utils"

interface ProgressRailProps {
  currentIndex: number
  answers: Answers
  onJump: (index: number) => void
}

export function ProgressRail({ currentIndex, answers, onJump }: ProgressRailProps) {
  return (
    <ol className="flex flex-col gap-0.5">
      {QUESTIONS.map((q, i) => {
        const answer = answers[q.id]
        const answered =
          Array.isArray(answer) ? answer.length > 0 : answer !== undefined
        const current = i === currentIndex
        return (
          <li key={q.id}>
            <button
              type="button"
              onClick={() => onJump(i)}
              className={cn(
                "group flex w-full items-center gap-3 rounded-md px-2 py-1.5 text-left text-[12px] transition-colors",
                current ? "text-foreground" : "text-muted-foreground hover:text-foreground",
              )}
              aria-current={current ? "step" : undefined}
            >
              <span
                className={cn(
                  "relative flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-mono transition-all duration-300",
                  current
                    ? "border-primary bg-primary/15 text-primary"
                    : answered
                      ? "border-primary/60 bg-primary/10 text-primary/80"
                      : "border-border/70 bg-transparent text-muted-foreground/60",
                )}
              >
                {answered ? (
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                ) : (
                  i + 1
                )}
                {current && (
                  <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-primary/20" />
                )}
              </span>
              <span className="flex flex-1 flex-col leading-tight">
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground/80">
                  {q.nodeLabel}
                </span>
                <span className="truncate text-[12.5px]">{q.title}</span>
              </span>
            </button>
          </li>
        )
      })}
    </ol>
  )
}
