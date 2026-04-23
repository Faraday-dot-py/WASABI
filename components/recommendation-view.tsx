"use client"

import { useState } from "react"
import {
  AlertTriangle,
  ArrowLeft,
  Compass,
  FlaskConical,
  Layers,
  Lightbulb,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  Target,
} from "lucide-react"
import { annotate } from "@/lib/annotate"
import { PATH_BY_ID } from "@/lib/decision-engine/paths"
import type { PathId, Recommendation } from "@/lib/decision-engine/types"
import { cn } from "@/lib/utils"

interface RecommendationViewProps {
  recommendation: Recommendation
  onEditAnswers: () => void
  onRestart: () => void
}

export function RecommendationView({
  recommendation,
  onEditAnswers,
  onRestart,
}: RecommendationViewProps) {
  const [focusedPath, setFocusedPath] = useState<PathId>(recommendation.primary)
  const path = PATH_BY_ID[focusedPath]
  const isPrimary = focusedPath === recommendation.primary

  return (
    <div className="flex h-full flex-col gap-4">
      <header className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <span className="section-kicker">Full recommendation</span>
          <div className="h-px flex-1 bg-[linear-gradient(90deg,var(--line-strong),transparent)]" />
        </div>

        <div className="flex flex-col gap-2">
          <div className="inline-flex w-fit items-center gap-2 rounded-full bg-[var(--sprout-soft)] px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-[var(--sprout-deep)]">
            <Sparkles className="h-3.5 w-3.5" />
            Recommendation ready
          </div>
          <h2 className="text-balance text-[30px] font-semibold leading-[1.02] tracking-[-0.045em] text-foreground">
            Here's what WASABI recommends.
          </h2>
          <p className="max-w-xl text-pretty text-[14.5px] leading-relaxed text-muted-foreground">
            Based on your answers. The alternatives below are real options —
            check the tradeoffs to see why they ranked lower.
          </p>
        </div>
      </header>

      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="wasabi-panel wasabi-panel-strong flex flex-col gap-5 px-5 py-5">
          <div className="flex flex-wrap gap-2">
            <PathChip
              id={recommendation.primary}
              active={focusedPath === recommendation.primary}
              primary
              onClick={() => setFocusedPath(recommendation.primary)}
            />
            {recommendation.alternatives.map((id) => (
              <PathChip
                key={id}
                id={id}
                active={focusedPath === id}
                onClick={() => setFocusedPath(id)}
              />
            ))}
          </div>

          <div className="rounded-[1.5rem] border border-[var(--line-soft)] bg-white/55 px-5 py-5">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="space-y-2">
                <div className="inline-flex w-fit items-center gap-2 rounded-full bg-[var(--paper)] px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  {isPrimary ? "Best fit" : "Alternative"}
                </div>
                <h3 className="text-[26px] font-semibold tracking-[-0.04em] text-foreground">
                  {path.name}
                </h3>
                <p className="max-w-xl text-[13.5px] leading-relaxed text-muted-foreground">
                  {annotate(path.tagline)}
                </p>
              </div>

              <div className="grid min-w-[180px] gap-2">
                <Stat icon={Target} label="Effort" value={path.effort} />
                <Stat icon={ShieldAlert} label="Risk" value={path.risk} />
                <Stat icon={Layers} label="Data" value={dataSignal(path.dataImplications)} />
              </div>
            </div>

            <p className="text-pretty text-[15px] leading-relaxed text-foreground/85">
              {annotate(path.summary)}
            </p>
          </div>

          {isPrimary && recommendation.rationale.length > 0 && (
            <Block
              icon={Lightbulb}
              title="Why this came out on top"
              items={recommendation.rationale}
              tone="positive"
            />
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <Block
              icon={Target}
              title="Best when"
              items={path.whenItFits}
              tone="neutral"
            />
            <Block
              icon={AlertTriangle}
              title="When to avoid this"
              items={path.avoidWhen}
              tone="warning"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Block
              icon={FlaskConical}
              title="First prototype"
              items={[path.firstPrototype]}
              tone="neutral"
            />
            <Block
              icon={Compass}
              title="How to evaluate"
              items={[path.evaluation]}
              tone="neutral"
            />
          </div>
        </section>

        <aside className="flex flex-col gap-4">
          <section className="wasabi-panel flex flex-col gap-3 px-4 py-4">
            <div className="wasabi-note-header">
              <Layers className="h-3.5 w-3.5" />
              <span>Next steps</span>
            </div>
            {path.nextSteps.length > 0 && (
              <ol className="flex flex-col gap-2">
                {path.nextSteps.map((step, index) => (
                  <li
                    key={step}
                    className="rounded-[1.1rem] border border-[var(--line-soft)] bg-white/55 px-3 py-3"
                  >
                    <div className="mb-1 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                      Step {String(index + 1).padStart(2, "0")}
                    </div>
                    <div className="text-[13.5px] leading-relaxed text-foreground/85">
                      {annotate(step)}
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </section>

          <section className="wasabi-panel flex flex-col gap-3 px-4 py-4">
            <div className="wasabi-note-header">
              <Layers className="h-3.5 w-3.5" />
              <span>What this means for your data</span>
            </div>
            <p className="text-[13.5px] leading-relaxed text-foreground/82">
              {annotate(path.dataImplications)}
            </p>
          </section>

          {isPrimary && recommendation.cautions.length > 0 && (
            <section className="wasabi-panel border-[var(--amber-line)] bg-[var(--amber-soft)] px-4 py-4">
              <div className="mb-3 flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-[var(--amber-ink)]">
                <AlertTriangle className="h-3.5 w-3.5" />
                Watch out for
              </div>
              <ul className="flex flex-col gap-2">
                {recommendation.cautions.map((caution) => (
                  <li
                    key={caution}
                    className="rounded-[1rem] border border-[var(--amber-line)] bg-white/55 px-3 py-3 text-[13px] leading-relaxed text-foreground/85"
                  >
                    {annotate(caution)}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <div className="mt-auto flex flex-wrap gap-2">
            <button
              onClick={onEditAnswers}
              className="inline-flex items-center gap-2 rounded-full border border-[var(--line-soft)] bg-white/50 px-4 py-2 text-sm text-muted-foreground transition-colors hover:border-[var(--line-strong)] hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Change answers
            </button>
            <button
              onClick={onRestart}
              className="inline-flex items-center gap-2 rounded-full border border-[var(--line-soft)] bg-white/50 px-4 py-2 text-sm text-muted-foreground transition-colors hover:border-[var(--line-strong)] hover:text-foreground"
            >
              <RefreshCw className="h-4 w-4" />
              Start over
            </button>
          </div>
        </aside>
      </div>
    </div>
  )
}

function PathChip({
  id,
  active,
  primary,
  onClick,
}: {
  id: PathId
  active: boolean
  primary?: boolean
  onClick: () => void
}) {
  const path = PATH_BY_ID[id]
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[12px] transition-all duration-300",
        active
          ? primary
            ? "border-[var(--amber-line)] bg-[var(--amber-soft)] text-[var(--amber-ink)]"
            : "border-[var(--sprout)] bg-[var(--sprout-soft)] text-[var(--sprout-deep)]"
          : "border-[var(--line-soft)] bg-white/55 text-muted-foreground hover:border-[var(--line-strong)] hover:text-foreground",
      )}
    >
      <span
        className={cn(
          "h-2 w-2 rounded-full",
          primary
            ? "bg-[var(--amber-branch)]"
            : "bg-[var(--sprout)]",
        )}
      />
      <span>{path.name}</span>
      {primary && (
        <span className="text-[10px] uppercase tracking-[0.2em]">
          lead
        </span>
      )}
    </button>
  )
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
}) {
  return (
    <div className="rounded-[1rem] border border-[var(--line-soft)] bg-[var(--paper)] px-3 py-2.5">
      <div className="mb-1 flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        <Icon className="h-3.5 w-3.5 text-[var(--sprout-deep)]" />
        {label}
      </div>
      <div className="text-[13.5px] font-medium capitalize text-foreground">
        {value}
      </div>
    </div>
  )
}

function Block({
  icon: Icon,
  title,
  items,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  items: string[]
  tone: "positive" | "warning" | "neutral"
}) {
  const toneClasses = {
    positive: "border-[var(--sprout)] bg-[var(--sprout-soft)]",
    warning: "border-[var(--amber-line)] bg-[var(--amber-soft)]",
    neutral: "border-[var(--line-soft)] bg-white/55",
  }[tone]

  return (
    <div className={cn("rounded-[1.3rem] border px-4 py-4", toneClasses)}>
      <div className="mb-3 flex items-center gap-2 text-[10.5px] uppercase tracking-[0.2em] text-muted-foreground">
        <Icon className="h-3.5 w-3.5 text-[var(--sprout-deep)]" />
        {title}
      </div>
      <ul className="flex flex-col gap-2">
        {items.map((item) => (
          <li key={item} className="text-[13.5px] leading-relaxed text-foreground/82">
            {annotate(item)}
          </li>
        ))}
      </ul>
    </div>
  )
}

function dataSignal(value: string): string {
  const lower = value.toLowerCase()
  if (lower.includes("label")) return "labels first"
  if (lower.includes("corpus")) return "corpus shaped"
  if (lower.includes("tool")) return "system interfaces"
  if (lower.includes("schema")) return "structured inputs"
  return "input driven"
}
