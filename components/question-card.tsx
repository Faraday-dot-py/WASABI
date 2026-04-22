"use client"

import { Check, Info, ArrowLeft, ArrowRight } from "lucide-react"
import type { Question } from "@/lib/decision-engine/types"
import { cn } from "@/lib/utils"

interface QuestionCardProps {
  question: Question
  index: number
  total: number
  answer: string | string[] | undefined
  onAnswer: (value: string | string[]) => void
  onNext: () => void
  onBack: () => void
  canGoBack: boolean
  canGoNext: boolean
}

export function QuestionCard({
  question,
  index,
  total,
  answer,
  onAnswer,
  onNext,
  onBack,
  canGoBack,
  canGoNext,
}: QuestionCardProps) {
  const multi = question.kind === "multi"
  const selected = new Set(
    Array.isArray(answer) ? answer : answer ? [answer] : [],
  )

  function toggle(value: string) {
    if (multi) {
      const next = new Set(selected)
      if (next.has(value)) next.delete(value)
      else next.add(value)
      onAnswer(Array.from(next))
    } else {
      onAnswer(value)
      // Single-select advances automatically after a short delay, which
      // makes the flow feel responsive without being jarring.
      window.setTimeout(onNext, 260)
    }
  }

  return (
    <div
      key={question.id}
      className="flex h-full flex-col gap-6 animate-in fade-in slide-in-from-bottom-2 duration-500"
    >
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
          <span>
            Step {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
          </span>
          <span className="h-px flex-1 bg-border/60" />
          <span className="text-primary/80">
            {multi ? "select all that apply" : "pick one"}
          </span>
        </div>
        <h2 className="text-pretty text-2xl font-semibold leading-tight text-foreground md:text-[28px]">
          {question.title}
        </h2>
        {question.subtitle && (
          <p className="text-pretty text-sm leading-relaxed text-muted-foreground">
            {question.subtitle}
          </p>
        )}
      </header>

      <div
        className="grid grid-cols-1 gap-2.5 sm:grid-cols-2"
        role={multi ? "group" : "radiogroup"}
        aria-label={question.title}
      >
        {question.options.map((opt, i) => {
          const isSelected = selected.has(opt.value)
          return (
            <button
              key={opt.value}
              type="button"
              role={multi ? "checkbox" : "radio"}
              aria-checked={isSelected}
              onClick={() => toggle(opt.value)}
              className={cn(
                "group relative flex items-start gap-3 rounded-lg border border-border/70 bg-card/40 px-4 py-3 text-left text-sm transition-all duration-300",
                "hover:border-primary/60 hover:bg-card/70",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60",
                isSelected &&
                  "border-primary/80 bg-primary/10 shadow-[0_0_0_1px_oklch(0.75_0.15_200_/_0.4),_0_0_24px_-4px_oklch(0.75_0.15_200_/_0.45)]",
              )}
              style={{
                animation: `fade-up 420ms ${i * 40}ms both cubic-bezier(0.22, 1, 0.36, 1)`,
              }}
            >
              <span
                className={cn(
                  "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-all duration-300",
                  multi ? "rounded-[4px]" : "rounded-full",
                  isSelected
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border/80 bg-background/60",
                )}
              >
                {isSelected && <Check className="h-3 w-3" strokeWidth={3} />}
              </span>
              <span className="flex flex-col gap-1">
                <span className="font-medium text-foreground">{opt.label}</span>
                {opt.hint && (
                  <span className="text-[12px] leading-snug text-muted-foreground">
                    {opt.hint}
                  </span>
                )}
              </span>
            </button>
          )
        })}
      </div>

      <div className="mt-auto flex flex-col gap-4">
        <div className="flex items-start gap-2 rounded-md border border-border/50 bg-muted/30 px-3 py-2.5 text-[12.5px] leading-relaxed text-muted-foreground">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary/80" />
          <span>
            <span className="font-medium text-foreground/80">Why this matters. </span>
            {question.why}
          </span>
        </div>

        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onBack}
            disabled={!canGoBack}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md border border-border/70 bg-transparent px-3 py-2 text-sm text-muted-foreground transition-colors",
              "hover:text-foreground hover:border-border disabled:pointer-events-none disabled:opacity-40",
            )}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </button>
          <button
            type="button"
            onClick={onNext}
            disabled={!canGoNext}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-all",
              "hover:brightness-110 disabled:pointer-events-none disabled:opacity-40",
              "shadow-[0_0_0_1px_oklch(0.75_0.15_200_/_0.4),_0_6px_24px_-6px_oklch(0.75_0.15_200_/_0.55)]",
            )}
          >
            {index === total - 1 ? "See recommendation" : "Next"}
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-up {
          from {
            opacity: 0;
            transform: translateY(6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}
