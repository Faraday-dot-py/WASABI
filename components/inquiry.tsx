"use client"

/**
 * Inquiry — the floating question composer.
 *
 * Structurally this replaces the old QuestionCard: instead of a boxed card
 * in a sidebar, the inquiry is a horizontal band that hovers over the
 * atlas. The question itself is set in a large serif; answers are
 * "living chips" that glow when active. Single-choice questions auto-
 * advance on pick; multi-choice questions wait for confirmation.
 */

import { useEffect, useMemo, useState } from "react"
import { ArrowLeft, ArrowRight, Check, HelpCircle } from "lucide-react"
import type { Question } from "@/lib/decision-engine/types"

interface Props {
  question: Question
  index: number
  total: number
  value: string | string[] | undefined
  onChange: (next: string | string[]) => void
  onAdvance: () => void
  onBack: () => void
  canBack: boolean
}

export function Inquiry({
  question,
  index,
  total,
  value,
  onChange,
  onAdvance,
  onBack,
  canBack,
}: Props) {
  const [showWhy, setShowWhy] = useState(false)

  // Reset the "why" expansion whenever the user moves to a new question.
  useEffect(() => {
    setShowWhy(false)
  }, [question.id])

  const selected = useMemo<Set<string>>(() => {
    if (Array.isArray(value)) return new Set(value)
    if (typeof value === "string") return new Set([value])
    return new Set()
  }, [value])

  const isMulti = question.kind === "multi"
  const canAdvance = isMulti ? selected.size > 0 : selected.size > 0

  function handlePick(optionValue: string) {
    if (isMulti) {
      const next = new Set(selected)
      if (next.has(optionValue)) next.delete(optionValue)
      else next.add(optionValue)
      onChange(Array.from(next))
    } else {
      onChange(optionValue)
      // Small delay so the user sees the selection before the map settles.
      window.setTimeout(() => onAdvance(), 260)
    }
  }

  return (
    <section
      key={question.id}
      aria-label={`Question ${index + 1} of ${total}`}
      className="atlas-rise relative flex w-full max-w-[780px] flex-col gap-5 rounded-2xl border border-border-strong/60 bg-[color-mix(in_oklch,var(--surface-strong)_86%,transparent)] p-6 shadow-[0_40px_80px_-40px_rgba(0,0,0,0.7),inset_0_1px_0_0_oklch(0.9_0.03_145/0.06)] backdrop-blur-xl md:p-7"
      style={{
        // Keep the inquiry visually anchored to the atlas — a faint warm
        // underglow from the terracotta accent when we're near the end.
        backgroundImage:
          "radial-gradient(120% 90% at 0% 0%, oklch(0.82 0.15 145 / 0.06), transparent 60%)",
      }}
    >
      {/* Meta row */}
      <header className="flex items-center gap-3 text-[10.5px] font-mono uppercase tracking-[0.22em] text-muted-foreground">
        <span className="text-primary/90">
          Step {String(index + 1).padStart(2, "0")}
          <span className="mx-1 text-muted-foreground/50">/</span>
          {String(total).padStart(2, "0")}
        </span>
        <span className="h-[10px] w-px bg-border" />
        <span>{question.nodeLabel}</span>
        <span className="ml-auto flex items-center gap-1.5 text-[10px] normal-case tracking-normal text-muted-foreground/80">
          {isMulti ? "select any that apply" : "select one"}
        </span>
      </header>

      {/* Question body */}
      <div className="flex flex-col gap-2">
        <h2 className="display-serif text-pretty text-[26px] font-medium leading-[1.15] tracking-tight text-foreground md:text-[30px]">
          {question.title}
        </h2>
        {question.subtitle && (
          <p className="max-w-[60ch] text-pretty text-[13.5px] leading-relaxed text-muted-foreground">
            {question.subtitle}
          </p>
        )}

        {/* "Why this matters" — collapsed inline; sits as a quiet, earned aid */}
        <button
          type="button"
          onClick={() => setShowWhy((s) => !s)}
          className="mt-1 flex w-fit items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:text-primary"
          aria-expanded={showWhy}
        >
          <HelpCircle className="h-3 w-3" strokeWidth={1.6} />
          {showWhy ? "hide rationale" : "why this matters"}
        </button>
        {showWhy && (
          <p className="atlas-settle max-w-[68ch] border-l border-primary/40 pl-3 text-[12.5px] italic leading-relaxed text-muted-foreground">
            {question.why}
          </p>
        )}
      </div>

      {/* Options */}
      <div className="flex flex-wrap gap-2">
        {question.options.map((opt) => {
          const active = selected.has(opt.value)
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => handlePick(opt.value)}
              aria-pressed={active}
              className={[
                "group relative flex items-center gap-2 rounded-full border px-3.5 py-2 text-[13px] transition-all",
                "focus-visible:ring-0",
                active
                  ? "border-primary/70 bg-primary/15 text-foreground shadow-[inset_0_0_0_1px_oklch(0.82_0.15_145/0.35),_0_8px_28px_-10px_oklch(0.82_0.15_145/0.5)]"
                  : "border-border/80 bg-surface text-muted-foreground hover:border-primary/40 hover:bg-[color-mix(in_oklch,var(--primary)_10%,var(--surface)_90%)] hover:text-foreground",
              ].join(" ")}
            >
              <span
                aria-hidden="true"
                className={[
                  "relative inline-flex h-1.5 w-1.5 rounded-full transition-all",
                  active
                    ? "bg-primary shadow-[0_0_10px_oklch(0.82_0.15_145/0.85)]"
                    : "bg-muted-foreground/40 group-hover:bg-primary/60",
                ].join(" ")}
              />
              <span className="font-medium leading-none tracking-tight">
                {opt.label}
              </span>
              {isMulti && active && (
                <Check className="ml-0.5 h-3 w-3 text-primary" strokeWidth={2} />
              )}
              {/* Hint tooltip rides below the chip on hover/focus for
                  desktop. It's decorative and not critical, so we hide it
                  on touch to avoid layout thrash. */}
              {opt.hint && (
                <span className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 hidden -translate-x-1/2 whitespace-nowrap rounded-md border border-border bg-popover px-2.5 py-1 text-[11px] text-muted-foreground opacity-0 shadow-xl transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 md:block">
                  {opt.hint}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Footer actions */}
      <footer className="flex items-center justify-between gap-3 pt-1">
        <button
          type="button"
          onClick={onBack}
          disabled={!canBack}
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-mono text-[10.5px] uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ArrowLeft className="h-3 w-3" strokeWidth={1.8} />
          previous
        </button>

        {isMulti ? (
          <button
            type="button"
            onClick={onAdvance}
            disabled={!canAdvance}
            className={[
              "inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12px] font-medium transition-all",
              canAdvance
                ? "bg-primary text-primary-foreground shadow-[0_10px_32px_-12px_oklch(0.82_0.15_145/0.7)] hover:brightness-110"
                : "cursor-not-allowed bg-surface text-muted-foreground/60",
            ].join(" ")}
          >
            continue
            <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
          </button>
        ) : (
          <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground/70">
            picking advances
          </span>
        )}
      </footer>
    </section>
  )
}
