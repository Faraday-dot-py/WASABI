"use client"

import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { ArrowLeft, ArrowRight, Check, Info } from "lucide-react"
import { annotate } from "@/lib/annotate"
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

function exclusiveValuesFor(question: Question) {
  if (question.id === "constraints") return ["none"]
  if (question.id === "system") return ["model-only"]
  return []
}

function WhyPopover({ question, multi }: { question: Question; multi: boolean }) {
  const [open, setOpen] = useState(false)
  const [pinned, setPinned] = useState(false)
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)
  const [mounted, setMounted] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const timer = useRef<number | null>(null)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    setOpen(false)
    setPinned(false)
    if (timer.current) clearTimeout(timer.current)
  }, [question.id])

  useEffect(() => {
    if (!pinned) return
    const handler = (e: MouseEvent) => {
      const target = e.target as Node
      const popup = document.getElementById("why-popup")
      if (!triggerRef.current?.contains(target) && !popup?.contains(target)) {
        setPinned(false)
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [pinned])

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current) }, [])

  const updatePos = () => {
    if (triggerRef.current) {
      const r = triggerRef.current.getBoundingClientRect()
      setPos({ top: r.bottom + 8, left: r.left })
    }
  }
  const show = () => {
    if (timer.current) clearTimeout(timer.current)
    updatePos()
    setOpen(true)
  }
  const hide = () => {
    if (pinned) return
    timer.current = window.setTimeout(() => setOpen(false), 150) as unknown as number
  }
  const toggle = () => {
    const next = !pinned
    setPinned(next)
    if (next) updatePos()
    setOpen(next)
  }

  const popup = open && pos && (
    <div
      id="why-popup"
      style={{ position: "fixed", top: pos.top, left: pos.left, zIndex: 9999 }}
      onMouseEnter={show}
      onMouseLeave={hide}
    >
      <div className="w-72 rounded-[1.25rem] border border-[var(--line-soft)] bg-[rgba(254,252,247,0.96)] p-4 shadow-[0_18px_40px_-30px_rgba(75,93,76,0.35)] backdrop-blur-lg">
        <div className="mb-2 text-[10.5px] uppercase tracking-[0.18em] text-[var(--sprout-deep)]">
          Why this signal matters
        </div>
        <p className="text-[13.5px] leading-relaxed text-foreground/80">
          {annotate(question.why)}
        </p>
        {multi && (
          <div className="mt-3 border-t border-[var(--line-soft)] pt-3">
            <div className="mb-1 flex items-center gap-1.5 text-[10.5px] uppercase tracking-[0.18em] text-muted-foreground">
              <span className="inline-block h-2 w-2 rounded-full bg-[var(--amber-branch)]" />
              Branching guidance
            </div>
            <p className="text-[12.5px] leading-relaxed text-foreground/75">
              Choose every condition that materially changes the kind of system
              you can trust or deploy. Conflicting shortcut answers are treated
              as exclusive.
            </p>
          </div>
        )}
      </div>
    </div>
  )

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onMouseEnter={show}
        onMouseLeave={hide}
        onClick={toggle}
        aria-expanded={open}
        aria-label="Why this signal matters"
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] transition-colors duration-150",
          pinned
            ? "border-[var(--sprout)] bg-[var(--sprout-soft)] text-[var(--sprout-deep)]"
            : open
              ? "border-[var(--line-strong)] bg-white/70 text-foreground"
              : "border-[var(--line-soft)] bg-white/50 text-muted-foreground hover:border-[var(--line-strong)] hover:text-foreground",
        )}
      >
        <Info className="h-3 w-3" />
        Why
      </button>
      {mounted && createPortal(popup, document.body)}
    </>
  )
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
  const exclusiveValues = exclusiveValuesFor(question)
  const autoAdvanceTimer = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (autoAdvanceTimer.current !== null) clearTimeout(autoAdvanceTimer.current)
    }
  }, [])

  function toggle(value: string) {
    if (multi) {
      const next = new Set(selected)
      const isExclusive = exclusiveValues.includes(value)

      if (next.has(value)) {
        next.delete(value)
      } else if (isExclusive) {
        next.clear()
        next.add(value)
      } else {
        for (const exclusiveValue of exclusiveValues) {
          next.delete(exclusiveValue)
        }
        next.add(value)
      }

      onAnswer(Array.from(next))
      return
    }

    onAnswer(value)
    autoAdvanceTimer.current = window.setTimeout(onNext, 220) as unknown as number
  }

  return (
    <div className="wasabi-panel wasabi-panel-strong flex h-full flex-col gap-5 overflow-hidden px-5 py-5 md:px-6 md:py-6">
      <header className="flex flex-col gap-3 flex-shrink-0">
        <div className="flex items-center gap-3">
          <span className="section-kicker">Question</span>
          <div className="h-px flex-1 bg-[linear-gradient(90deg,var(--line-strong),transparent)]" />
          <span className="text-[11px] text-muted-foreground">
            {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
          </span>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="signal-chip">{question.nodeLabel}</span>
            <span className="signal-chip signal-chip-muted">
              {multi ? "branchable" : "single signal"}
            </span>
            <WhyPopover question={question} multi={multi} />
          </div>
          <h2 className="text-balance text-[26px] font-semibold leading-[1.05] tracking-[-0.04em] text-foreground md:text-[32px]">
            {question.title}
          </h2>
          {question.subtitle && (
            <p className="text-pretty text-[13.5px] leading-relaxed text-muted-foreground">
              {annotate(question.subtitle)}
            </p>
          )}
        </div>
      </header>

      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
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
                  "option-bloom group relative overflow-hidden rounded-[1.2rem] border px-3 py-3 text-left transition-all duration-500",
                  isSelected && "option-bloom-selected",
                )}
                style={{
                  animation: `fade-up 520ms ${i * 55}ms both cubic-bezier(0.22, 1, 0.36, 1)`,
                }}
              >
                <span className="option-bloom-sheen" />
                <div className="relative flex items-start gap-2.5">
                  <span
                    className={cn(
                      "mt-0.5 flex h-4.5 w-4.5 shrink-0 items-center justify-center border transition-all duration-300",
                      multi ? "rounded-[0.35rem]" : "rounded-full",
                      isSelected
                        ? "border-[var(--sprout-strong)] bg-[var(--sprout-strong)] text-[var(--sprout-ink)]"
                        : "border-[var(--line-soft)] bg-white/50 text-transparent",
                    )}
                  >
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </span>

                  <span className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="text-[13.5px] font-medium leading-snug text-foreground">
                      {opt.label}
                    </span>
                    {opt.hint && (
                      <span className="text-[11.5px] leading-relaxed text-muted-foreground">
                        {annotate(opt.hint)}
                      </span>
                    )}
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex-shrink-0 flex items-center justify-between gap-3 border-t border-[var(--line-soft)] pt-4">
        <button
          type="button"
          onClick={onBack}
          disabled={!canGoBack}
          className="inline-flex items-center gap-2 rounded-full border border-[var(--line-soft)] bg-white/50 px-4 py-2 text-sm text-muted-foreground transition-colors hover:border-[var(--line-strong)] hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <button
          type="button"
          onClick={onNext}
          disabled={!canGoNext}
          className="inline-flex items-center gap-2 rounded-full bg-[var(--sprout-strong)] px-5 py-2.5 text-sm font-semibold text-[var(--sprout-ink)] transition-transform duration-200 hover:-translate-y-0.5 disabled:pointer-events-none disabled:opacity-40"
        >
          {index === total - 1 ? "Reveal recommendation" : "Continue"}
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      <style jsx>{`
        @keyframes fade-up {
          from {
            opacity: 0;
            transform: translateY(10px);
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
