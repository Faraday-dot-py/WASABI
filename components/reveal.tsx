"use client"

/**
 * Reveal — the recommendation unfold.
 *
 * The landscape has settled. This surface emerges over the atlas (the map
 * keeps breathing behind it) and presents the converged path as a single
 * editorial moment: big serif title, one-line tagline, short summary, then
 * layered "strata" of detail — when it fits, when to avoid, data
 * implications, prototype + evaluation, next steps, cautions — each
 * settling in with a small stagger.
 *
 * Alternative territories are shown as two small satellite cards. Clicking
 * one swaps the viewer to that path without leaving the reveal, so users
 * can explore neighbouring ridges before committing.
 */

import { useMemo, useState } from "react"
import {
  AlertTriangle,
  ArrowUpRight,
  Compass,
  Layers,
  MapPin,
  RefreshCw,
  Sparkles,
} from "lucide-react"
import { PATH_BY_ID, PATHS } from "@/lib/decision-engine/paths"
import type { BuildPath, PathId, Recommendation } from "@/lib/decision-engine/types"

interface Props {
  recommendation: Recommendation
  onRestart: () => void
}

export function Reveal({ recommendation, onRestart }: Props) {
  // The user can inspect alternative ridges; `viewing` tracks which path's
  // detail strata are shown. The primary rationale and cautions remain
  // anchored to the actual recommendation.
  const [viewing, setViewing] = useState<PathId>(recommendation.primary)
  const current = PATH_BY_ID[viewing]
  const isPrimary = viewing === recommendation.primary

  const { confidencePct, marginPct, topScore } = useMemo(() => {
    const entries = Object.entries(recommendation.scores) as [PathId, number][]
    const top = entries.find(([id]) => id === recommendation.primary)?.[1] ?? 0
    const sorted = entries.slice().sort((a, b) => b[1] - a[1])
    const second = sorted[1]?.[1] ?? 0
    const sumPositive = entries.reduce((acc, [, v]) => acc + Math.max(0, v), 0)
    const confidence = sumPositive > 0 ? Math.max(0, top) / sumPositive : 0
    const margin = top - second
    return {
      confidencePct: Math.round(confidence * 100),
      marginPct: Math.max(0, Math.round(margin * 100)),
      topScore: top,
    }
  }, [recommendation])

  return (
    <div className="relative mx-auto flex w-full max-w-[940px] flex-col gap-6">
      {/* Backdrop scrim so the atlas reads calmer behind the reveal. */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_50%_45%,transparent_0%,oklch(0.14_0.018_155/0.7)_65%)]"
      />

      {/* Meta strip */}
      <header
        className="atlas-settle flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-border/60 pb-4"
        style={{ animationDelay: "40ms" }}
      >
        <div className="flex items-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.22em] text-primary/90">
          <Compass className="h-3 w-3" strokeWidth={1.6} />
          the landscape has settled
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-4 text-[10.5px] font-mono uppercase tracking-[0.2em] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            confidence
            <span className="rounded-full bg-surface px-2 py-0.5 tabular-nums text-foreground">
              {confidencePct}%
            </span>
          </span>
          <span className="flex items-center gap-1.5">
            margin
            <span className="rounded-full bg-surface px-2 py-0.5 tabular-nums text-foreground">
              +{marginPct}
            </span>
          </span>
          <button
            type="button"
            onClick={onRestart}
            className="inline-flex items-center gap-1.5 rounded-full border border-border/70 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
          >
            <RefreshCw className="h-3 w-3" strokeWidth={1.8} />
            walk the atlas again
          </button>
        </div>
      </header>

      {/* Hero ridge */}
      <section
        className="atlas-settle flex flex-col gap-4"
        style={{ animationDelay: "120ms" }}
      >
        {!isPrimary && (
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-accent">
            <MapPin className="h-3 w-3" strokeWidth={1.8} />
            viewing an alternative ridge
            <button
              type="button"
              onClick={() => setViewing(recommendation.primary)}
              className="ml-1 text-muted-foreground underline underline-offset-2 hover:text-foreground"
            >
              return to primary
            </button>
          </div>
        )}

        <div className="flex flex-col gap-3">
          <span className="font-mono text-[10.5px] uppercase tracking-[0.28em] text-primary/90">
            {isPrimary ? "your path" : "neighbouring ridge"}
          </span>
          <h1 className="display-serif text-pretty text-[40px] font-medium leading-[1.02] tracking-tight text-foreground md:text-[56px]">
            {current.name}
          </h1>
          <p className="max-w-[62ch] text-pretty text-[15px] leading-relaxed text-muted-foreground md:text-[16px]">
            {current.tagline}
          </p>
        </div>

        {/* Thin "horizon line" glyph beneath the title — a hand-drawn feel
            that suggests topography without being decorative clutter. */}
        <HorizonGlyph score={topScore} />

        <p className="max-w-[72ch] text-pretty text-[14.5px] leading-relaxed text-foreground/90">
          {current.summary}
        </p>

        <EffortRiskRow path={current} />
      </section>

      {/* Rationale — why this ridge emerged, in the engine's own voice. */}
      {isPrimary && recommendation.rationale.length > 0 && (
        <section
          className="atlas-settle flex flex-col gap-3 rounded-2xl border border-primary/30 bg-[color-mix(in_oklch,var(--surface)_92%,var(--primary)_8%)] p-5"
          style={{ animationDelay: "200ms" }}
        >
          <div className="flex items-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.22em] text-primary/90">
            <Sparkles className="h-3 w-3" strokeWidth={1.6} />
            why the terrain pointed here
          </div>
          <ul className="flex flex-col gap-2.5">
            {recommendation.rationale.map((r, i) => (
              <li
                key={i}
                className="relative flex items-start gap-3 pl-1 text-[13.5px] leading-relaxed text-foreground/90"
              >
                <span
                  aria-hidden="true"
                  className="mt-[9px] h-1 w-4 shrink-0 rounded-full bg-primary/70"
                />
                <span className="flex-1">{r}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Strata */}
      <div className="flex flex-col gap-5">
        <Stratum
          delay={280}
          eyebrow="when this ridge fits"
          icon={<Layers className="h-3 w-3" strokeWidth={1.6} />}
        >
          <div className="grid gap-5 md:grid-cols-2">
            <StrataList items={current.whenItFits} tone="primary" />
            <StrataList items={current.avoidWhen} tone="muted" title="avoid when" />
          </div>
        </Stratum>

        <Stratum
          delay={360}
          eyebrow="what this means for your data"
          icon={<Layers className="h-3 w-3" strokeWidth={1.6} />}
        >
          <p className="text-[14px] leading-relaxed text-foreground/90">
            {current.dataImplications}
          </p>
        </Stratum>

        <Stratum
          delay={440}
          eyebrow="how to start walking"
          icon={<ArrowUpRight className="h-3 w-3" strokeWidth={1.6} />}
        >
          <div className="grid gap-5 md:grid-cols-2">
            <BlockField label="first prototype" body={current.firstPrototype} />
            <BlockField label="how you'll evaluate" body={current.evaluation} />
          </div>
        </Stratum>

        <Stratum
          delay={520}
          eyebrow="next steps"
          icon={<ArrowUpRight className="h-3 w-3" strokeWidth={1.6} />}
        >
          <ol className="flex flex-col gap-2.5">
            {current.nextSteps.map((s, i) => (
              <li
                key={i}
                className="flex items-start gap-3 text-[14px] leading-relaxed text-foreground/90"
              >
                <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-primary/40 bg-primary/10 font-mono text-[10px] tabular-nums text-primary">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="flex-1">{s}</span>
              </li>
            ))}
          </ol>
        </Stratum>

        {/* Cautions — shown as a warm terracotta aside. Only when viewing
            the primary; alternatives are exploratory, not prescriptive. */}
        {isPrimary && recommendation.cautions.length > 0 && (
          <section
            className="atlas-settle flex flex-col gap-3 rounded-2xl border border-accent/35 bg-[color-mix(in_oklch,var(--surface)_92%,var(--accent)_8%)] p-5"
            style={{ animationDelay: "600ms" }}
          >
            <div className="flex items-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.22em] text-accent">
              <AlertTriangle className="h-3 w-3" strokeWidth={1.6} />
              watch out for
            </div>
            <ul className="flex flex-col gap-2">
              {recommendation.cautions.map((c, i) => (
                <li
                  key={i}
                  className="flex items-start gap-3 text-[13.5px] leading-relaxed text-foreground/90"
                >
                  <span
                    aria-hidden="true"
                    className="mt-[9px] h-1 w-4 shrink-0 rounded-full bg-accent/80"
                  />
                  <span className="flex-1">{c}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      {/* Alternative ridges */}
      {recommendation.alternatives.length > 0 && (
        <section
          className="atlas-settle flex flex-col gap-3 pt-2"
          style={{ animationDelay: "680ms" }}
        >
          <div className="flex items-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.22em] text-muted-foreground">
            neighbouring ridges worth knowing
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {[recommendation.primary, ...recommendation.alternatives]
              .filter((id, idx, arr) => arr.indexOf(id) === idx)
              .filter((id) => id !== viewing)
              .slice(0, 2)
              .map((id) => {
                const p = PATH_BY_ID[id]
                const isPrimaryCard = id === recommendation.primary
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setViewing(id)}
                    className="group flex flex-col gap-1.5 rounded-xl border border-border/70 bg-surface p-4 text-left transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:bg-[color-mix(in_oklch,var(--surface)_85%,var(--primary)_15%)]"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-mono text-[9.5px] uppercase tracking-[0.22em] text-muted-foreground">
                        {isPrimaryCard ? "primary" : "alternative"}
                      </span>
                      <ArrowUpRight
                        className="h-3.5 w-3.5 text-muted-foreground transition-colors group-hover:text-primary"
                        strokeWidth={1.8}
                      />
                    </div>
                    <span className="text-[15.5px] font-medium leading-tight tracking-tight text-foreground">
                      {p.name}
                    </span>
                    <span className="text-[12.5px] leading-relaxed text-muted-foreground">
                      {p.tagline}
                    </span>
                  </button>
                )
              })}
          </div>
        </section>
      )}

      {/* Scoreboard — the full ranking, so the user can see the whole map */}
      <section
        className="atlas-settle flex flex-col gap-2 pt-4"
        style={{ animationDelay: "760ms" }}
      >
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-muted-foreground">
            full ranking
          </span>
        </div>
        <FullRanking recommendation={recommendation} viewing={viewing} onView={setViewing} />
      </section>
    </div>
  )
}

// ---------------------------------------------------------------------------

function HorizonGlyph({ score }: { score: number }) {
  // A thin SVG horizon with a single peak, scaled by score. Pure decoration
  // but it ties the hero back to the atlas metaphor.
  const peak = Math.max(0.15, Math.min(1, score * 0.6))
  return (
    <svg
      viewBox="0 0 320 36"
      className="h-6 w-full max-w-[420px] text-primary/70"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="horizonStroke" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0" />
          <stop offset="20%" stopColor="currentColor" stopOpacity="0.8" />
          <stop offset="80%" stopColor="currentColor" stopOpacity="0.8" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d={`M 0 26 L 80 26 L 140 ${26 - 22 * peak} L 170 ${26 - 14 * peak} L 210 ${26 - 24 * peak} L 260 26 L 320 26`}
        fill="none"
        stroke="url(#horizonStroke)"
        strokeWidth="1.1"
      />
      <circle
        cx={210}
        cy={26 - 24 * peak}
        r={2.4}
        fill="oklch(0.86 0.14 55)"
        opacity="0.95"
      />
    </svg>
  )
}

function EffortRiskRow({ path }: { path: BuildPath }) {
  const badge = (label: string, value: string) => (
    <div className="flex items-center gap-2 rounded-full border border-border/70 bg-surface px-3 py-1">
      <span className="font-mono text-[9.5px] uppercase tracking-[0.22em] text-muted-foreground">
        {label}
      </span>
      <span className="text-[11.5px] capitalize text-foreground/90">{value}</span>
    </div>
  )
  return (
    <div className="flex flex-wrap gap-2 pt-1">
      {badge("effort", path.effort)}
      {badge("risk", path.risk)}
    </div>
  )
}

function Stratum({
  eyebrow,
  icon,
  children,
  delay,
}: {
  eyebrow: string
  icon: React.ReactNode
  children: React.ReactNode
  delay: number
}) {
  return (
    <section
      className="atlas-settle flex flex-col gap-3 border-l border-border/60 pl-4"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.22em] text-muted-foreground">
        {icon}
        {eyebrow}
      </div>
      {children}
    </section>
  )
}

function StrataList({
  items,
  tone,
  title,
}: {
  items: string[]
  tone: "primary" | "muted"
  title?: string
}) {
  return (
    <div className="flex flex-col gap-2">
      {title && (
        <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground/90">
          {title}
        </span>
      )}
      <ul className="flex flex-col gap-2">
        {items.map((t, i) => (
          <li
            key={i}
            className="flex items-start gap-3 text-[13.5px] leading-relaxed text-foreground/90"
          >
            <span
              aria-hidden="true"
              className={[
                "mt-[9px] h-1 w-4 shrink-0 rounded-full",
                tone === "primary" ? "bg-primary/70" : "bg-border-strong",
              ].join(" ")}
            />
            <span className="flex-1">{t}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function BlockField({ label, body }: { label: string; body: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground/90">
        {label}
      </span>
      <p className="text-[14px] leading-relaxed text-foreground/90">{body}</p>
    </div>
  )
}

function FullRanking({
  recommendation,
  viewing,
  onView,
}: {
  recommendation: Recommendation
  viewing: PathId
  onView: (id: PathId) => void
}) {
  const sorted = useMemo(() => {
    const entries = Object.entries(recommendation.scores) as [PathId, number][]
    const max = Math.max(0.0001, ...entries.map(([, v]) => v))
    const min = Math.min(...entries.map(([, v]) => v), 0)
    return entries
      .slice()
      .sort((a, b) => b[1] - a[1])
      .map(([id, score]) => ({
        id,
        score,
        normalized: max === 0 ? 0 : Math.max(0, (score - min) / (max - min || 1)),
      }))
  }, [recommendation])

  return (
    <ul className="flex flex-col gap-1">
      {sorted.map(({ id, normalized }, i) => {
        const p = PATHS.find((pp) => pp.id === id)
        if (!p) return null
        const isLeader = id === recommendation.primary
        const isViewing = id === viewing
        return (
          <li key={id}>
            <button
              type="button"
              onClick={() => onView(id)}
              aria-current={isViewing ? "true" : undefined}
              className={[
                "grid w-full grid-cols-[28px_1fr_180px] items-center gap-3 rounded-lg px-2 py-1.5 text-left transition-colors",
                isViewing ? "bg-surface" : "hover:bg-surface/60",
              ].join(" ")}
            >
              <span className="font-mono text-[10px] tabular-nums text-muted-foreground">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span
                className={[
                  "truncate text-[13px] leading-tight tracking-tight",
                  isLeader
                    ? "text-accent"
                    : isViewing
                      ? "text-foreground"
                      : "text-foreground/80",
                ].join(" ")}
              >
                {p.name}
              </span>
              <span className="relative h-[3px] w-full overflow-hidden rounded-full bg-border/60">
                <span
                  className={[
                    "absolute inset-y-0 left-0 rounded-full transition-[width] duration-700",
                    isLeader ? "bg-accent" : "bg-primary/60",
                  ].join(" ")}
                  style={{ width: `${Math.round(normalized * 100)}%` }}
                />
              </span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
