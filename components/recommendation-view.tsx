"use client"

import { useState } from "react"
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Compass,
  FlaskConical,
  Gauge,
  Layers,
  Lightbulb,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  Target,
} from "lucide-react"
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
    <div className="flex h-full flex-col gap-5 animate-in fade-in slide-in-from-bottom-3 duration-700">
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
          <Sparkles className="h-3 w-3 text-primary" />
          <span className="text-primary">Output resolved</span>
          <span className="h-px flex-1 bg-border/60" />
          <button
            onClick={onEditAnswers}
            className="inline-flex items-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3 w-3" />
            edit answers
          </button>
        </div>
        <h2 className="text-pretty text-[28px] font-semibold leading-tight text-foreground md:text-[32px]">
          Your recommended path
        </h2>
      </header>

      {/* Path switcher */}
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

      {/* Focused path detail */}
      <section
        key={focusedPath}
        className="flex flex-col gap-5 rounded-xl border border-border/70 bg-card/50 p-5 backdrop-blur-sm animate-in fade-in duration-500"
      >
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.2em] text-primary/90">
            {isPrimary ? "primary recommendation" : "alternative path"}
          </div>
          <h3 className="text-[22px] font-semibold leading-tight text-foreground">
            {path.name}
          </h3>
          <p className="text-[13px] text-muted-foreground">{path.tagline}</p>
        </div>

        <p className="text-pretty text-[14px] leading-relaxed text-foreground/90">
          {path.summary}
        </p>

        {isPrimary && recommendation.rationale.length > 0 && (
          <div className="flex flex-col gap-2 rounded-lg border border-primary/25 bg-primary/5 p-4">
            <div className="flex items-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.2em] text-primary">
              <Lightbulb className="h-3 w-3" />
              Why this fits
            </div>
            <ul className="flex flex-col gap-1.5 text-[13px] leading-relaxed text-foreground/90">
              {recommendation.rationale.map((r, i) => (
                <li key={i} className="flex gap-2">
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Stat icon={Gauge} label="Effort" value={path.effort} />
          <Stat icon={ShieldAlert} label="Risk" value={path.risk} />
          <Stat icon={Layers} label="Data" value={dataSignal(path.dataImplications)} />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Block
            icon={Target}
            title="When it fits"
            items={path.whenItFits}
            tone="positive"
          />
          <Block
            icon={AlertTriangle}
            title="Avoid when"
            items={path.avoidWhen}
            tone="warning"
          />
        </div>

        <Block
          icon={FlaskConical}
          title="First prototype"
          items={[path.firstPrototype]}
          tone="info"
        />

        <Block
          icon={Compass}
          title="Evaluation approach"
          items={[path.evaluation]}
          tone="info"
        />

        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.2em] text-muted-foreground">
            Immediate next steps
          </div>
          <ol className="flex flex-col gap-2">
            {path.nextSteps.map((step, i) => (
              <li
                key={i}
                className="flex items-start gap-3 rounded-lg border border-border/60 bg-background/40 px-3 py-2.5 text-[13px] leading-relaxed text-foreground/90"
              >
                <span className="font-mono text-[11px] font-medium text-primary">
                  0{i + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="flex flex-col gap-1 rounded-lg border border-border/60 bg-background/30 p-3">
          <div className="font-mono text-[10.5px] uppercase tracking-[0.2em] text-muted-foreground">
            Data implications
          </div>
          <p className="text-[13px] leading-relaxed text-foreground/85">
            {path.dataImplications}
          </p>
        </div>
      </section>

      {isPrimary && recommendation.cautions.length > 0 && (
        <section className="flex flex-col gap-2 rounded-xl border border-accent/30 bg-accent/5 p-4">
          <div className="flex items-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.2em] text-accent/90">
            <AlertTriangle className="h-3 w-3" />
            Watch out for
          </div>
          <ul className="flex flex-col gap-1.5 text-[13px] leading-relaxed text-foreground/90">
            {recommendation.cautions.map((c, i) => (
              <li key={i} className="flex gap-2">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-accent/80" />
                <span>{c}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="mt-auto flex items-center justify-between gap-2 pt-2">
        <button
          onClick={onEditAnswers}
          className="inline-flex items-center gap-1.5 rounded-md border border-border/70 bg-transparent px-3 py-2 text-sm text-muted-foreground transition-colors hover:border-border hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Revise answers
        </button>
        <button
          onClick={onRestart}
          className="inline-flex items-center gap-1.5 rounded-md border border-border/70 bg-transparent px-3 py-2 text-sm text-muted-foreground transition-colors hover:border-border hover:text-foreground"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Start over
        </button>
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
        "group inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[12px] transition-all duration-300",
        active
          ? primary
            ? "border-accent/60 bg-accent/10 text-foreground shadow-[0_0_0_1px_oklch(0.88_0.14_55_/_0.3),_0_0_24px_-6px_oklch(0.88_0.14_55_/_0.5)]"
            : "border-primary/60 bg-primary/10 text-foreground"
          : "border-border/60 bg-transparent text-muted-foreground hover:border-border hover:text-foreground",
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full transition-colors",
          primary
            ? active
              ? "bg-accent"
              : "bg-accent/60"
            : active
              ? "bg-primary"
              : "bg-primary/60",
        )}
      />
      <span className="font-medium">{path.name}</span>
      {primary && (
        <span className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-accent/90">
          top match
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
    <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-background/40 px-3 py-2.5">
      <Icon className="h-4 w-4 text-primary/80" />
      <div className="flex flex-col leading-tight">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          {label}
        </span>
        <span className="text-[13px] font-medium capitalize text-foreground">
          {value}
        </span>
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
  tone: "positive" | "warning" | "info"
}) {
  const toneClasses = {
    positive: "border-primary/25 bg-primary/5 text-primary",
    warning: "border-accent/25 bg-accent/5 text-accent",
    info: "border-border/60 bg-background/40 text-muted-foreground",
  }[tone]
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border/60 bg-background/30 p-3">
      <div
        className={cn(
          "flex items-center gap-2 rounded-md border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] w-fit",
          toneClasses,
        )}
      >
        <Icon className="h-3 w-3" />
        {title}
      </div>
      <ul className="flex flex-col gap-1 text-[13px] leading-relaxed text-foreground/90">
        {items.map((t, i) => (
          <li key={i}>{t}</li>
        ))}
      </ul>
    </div>
  )
}

function dataSignal(s: string): string {
  const lower = s.toLowerCase()
  if (lower.includes("label")) return "labels-driven"
  if (lower.includes("corpus")) return "corpus-driven"
  if (lower.includes("tool")) return "interface-driven"
  if (lower.includes("schema")) return "schema-driven"
  return "input-driven"
}
