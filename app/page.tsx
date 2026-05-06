"use client"

import { useEffect, useMemo, useState } from "react"
import {
  ArrowLeft,
  ArrowRight,
  Brain,
  GitBranch,
  Maximize2,
  Radar,
  RefreshCw,
  RotateCcw,
  Sparkles,
} from "lucide-react"
import { NeuralNetwork } from "@/components/neural-network"
import { QuestionCard } from "@/components/question-card"
import { RecommendationView } from "@/components/recommendation-view"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { track } from "@vercel/analytics"
import { computeNetworkState, computeRecommendation, HIDDEN_1, HIDDEN_2 } from "@/lib/decision-engine/engine"
import { PATH_BY_ID } from "@/lib/decision-engine/paths"
import { QUESTIONS } from "@/lib/decision-engine/questions"
import type { Answers, PathId } from "@/lib/decision-engine/types"
import { PRESET_BY_ID } from "@/lib/presets"
import { decodeAnswers, encodeAnswers } from "@/lib/share"
import { cn } from "@/lib/utils"

type Stage = "intro" | "flow" | "done"

export default function Page() {
  const [stage, setStage] = useState<Stage>("intro")
  const [answers, setAnswers] = useState<Answers>({})
  const [currentIndex, setCurrentIndex] = useState(0)
  const [indexHistory, setIndexHistory] = useState<number[]>([])
  const [copied, setCopied] = useState(false)
  const [activePreset, setActivePreset] = useState<string | null>(null)
  const [compactNetwork, setCompactNetwork] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const s = params.get("s")
    const presetId = params.get("preset")

    if (s) {
      const decoded = decodeAnswers(s)
      if (decoded && Object.keys(decoded).length > 0) {
        setAnswers(decoded) // eslint-disable-line react-hooks/set-state-in-effect
        setCurrentIndex(QUESTIONS.length - 1)
        setStage("done")
        return
      }
    }

    if (presetId) {
      const preset = PRESET_BY_ID[presetId]
      if (preset) {
        setAnswers(preset.answers as Answers)
        setActivePreset(preset.id)
        setStage("flow")
        setCurrentIndex(0)
      }
    }
  }, [])

  useEffect(() => {
    if (stage === "done" && Object.keys(answers).length > 0) {
      const encoded = encodeAnswers(answers)
      const url = new URL(window.location.href)
      url.searchParams.set("s", encoded)
      window.history.replaceState(null, "", url.toString())
    }
  }, [stage, answers])

  useEffect(() => {
    const media = window.matchMedia("(max-width: 767px)")
    const syncCompact = () => setCompactNetwork(media.matches)

    syncCompact()
    media.addEventListener("change", syncCompact)

    return () => media.removeEventListener("change", syncCompact)
  }, [])

  const networkState = useMemo(() => computeNetworkState(answers), [answers])
  const recommendation = useMemo(() => computeRecommendation(answers), [answers])

  const answeredCount = useMemo(
    () =>
      Object.values(answers).filter((value) =>
        Array.isArray(value) ? value.length > 0 : value !== undefined && value !== "",
      ).length,
    [answers],
  )

  const completion = answeredCount / QUESTIONS.length
  const activeQuestion =
    stage === "flow" && currentIndex < QUESTIONS.length
      ? QUESTIONS[currentIndex]
      : null
  const canShowPreview = stage === "done" || answeredCount >= 2
  const primary = canShowPreview ? recommendation.primary : null
  const alternatives = canShowPreview ? recommendation.alternatives : []
  const strongestSignals = useMemo(
    () => collectDominantSignals(networkState),
    [networkState],
  )

  function setAnswer(id: string, value: string | string[]) {
    setAnswers((prev) => ({ ...prev, [id]: value }))
    track("question_answered", { question: id })
  }

  function nextStep() {
    const q = QUESTIONS[currentIndex]
    const currentAnswer = answers[q.id]
    const branchTarget =
      q.branches && typeof currentAnswer === "string"
        ? q.branches[currentAnswer]
        : undefined
    const targetIndex = branchTarget
      ? QUESTIONS.findIndex((x) => x.id === branchTarget)
      : currentIndex + 1
    const next = targetIndex >= 0 ? targetIndex : currentIndex + 1
    setIndexHistory((h) => [...h, currentIndex])
    if (next >= QUESTIONS.length) {
      setStage("done")
      track("recommendation_shown", { primary: recommendation.primary })
    } else {
      setCurrentIndex(next)
    }
  }

  function prevStep() {
    setIndexHistory((h) => {
      const prev = h[h.length - 1]
      if (prev !== undefined) {
        setCurrentIndex(prev)
        return h.slice(0, -1)
      }
      return h
    })
  }

  function jumpTo(index: number) {
    setStage("flow")
    setCurrentIndex(Math.max(0, Math.min(QUESTIONS.length - 1, index)))
  }

  function beginFlow() {
    setStage("flow")
    setCurrentIndex(0)
    setIndexHistory([])
    track("flow_started")
  }

  function editAnswers() {
    setStage("flow")
    setCurrentIndex(QUESTIONS.length - 1)
    setIndexHistory([])
    track("answers_edited")
  }

  function restart() {
    setAnswers({})
    setCurrentIndex(0)
    setIndexHistory([])
    setActivePreset(null)
    setStage("intro")
    const url = new URL(window.location.href)
    url.searchParams.delete("s")
    url.searchParams.delete("preset")
    window.history.replaceState(null, "", url.toString())
    track("restarted")
  }

  return (
    <main className="wasabi-shell">
      <div className="wasabi-ambient wasabi-ambient-a" />
      <div className="wasabi-ambient wasabi-ambient-b" />
      <div className="wasabi-grain" />
      <div className="wasabi-topography" />

      <header className="wasabi-topbar">
        <div className="flex items-center gap-3">
          <div className="wasabi-brand-mark">
            <Brain className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-[22px] font-bold leading-none tracking-[-0.05em] text-foreground">
              WASABI
            </span>
            <span className="text-[9px] uppercase tracking-[0.22em] text-muted-foreground">
              what ai system am i building into
            </span>
          </div>
        </div>

        <div className="hidden items-center justify-center md:flex">
          <div className="topbar-progress">
            <div className="topbar-progress-track">
              <div
                className="topbar-progress-fill"
                style={{ width: `${Math.max(2, completion * 100)}%` }}
              />
            </div>
            <span className="topbar-progress-label">{answeredCount} / {QUESTIONS.length}</span>
          </div>
        </div>

        <button onClick={restart} className="status-reset">
          <RotateCcw className="h-3.5 w-3.5" />
          Reset
        </button>
      </header>

      {activePreset && PRESET_BY_ID[activePreset] && (
        <div className="flex items-center justify-between gap-3 border-b border-[var(--line-soft)] bg-[var(--sprout-soft)] px-5 py-2 text-[12px] text-[var(--sprout-deep)] no-print">
          <span>
            <span className="font-medium">{PRESET_BY_ID[activePreset].name}</span>
            {" — "}
            {PRESET_BY_ID[activePreset].description}
            {" "}Some answers are pre-filled — change any you disagree with.
          </span>
          <button
            onClick={() => setActivePreset(null)}
            className="shrink-0 text-[11px] underline opacity-70 hover:opacity-100"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="wasabi-layout">
        <aside className="wasabi-column">
          {stage === "intro" ? (
            <IntroPanel onBegin={beginFlow} />
          ) : stage === "flow" ? (
            <div className="flex h-full flex-col gap-4">
              <QuestionCard
                question={QUESTIONS[currentIndex]}
                index={currentIndex}
                total={QUESTIONS.length}
                answer={answers[QUESTIONS[currentIndex].id] as
                  | string
                  | string[]
                  | undefined}
                onAnswer={(value) => setAnswer(QUESTIONS[currentIndex].id, value)}
                onNext={nextStep}
                onBack={prevStep}
                canGoBack={indexHistory.length > 0}
                canGoNext={isAnsweredFor(QUESTIONS[currentIndex].id, answers)}
              />
            </div>
          ) : (
            <JourneyAtlas answers={answers} onEditAnswers={editAnswers} />
          )}
        </aside>

        <section className="wasabi-landscape">
          <div className="landscape-header">
            <span className="section-kicker">Inference map</span>
          </div>

          <div className="network-info-strip">
            <div className="signal-group">
              <div className="overlay-label">
                <Radar className="h-3.5 w-3.5" />
                Active signals
              </div>
              <div className="flex flex-wrap gap-2">
                {strongestSignals.map((signal) => (
                  <SignalPill key={signal.label} label={signal.label} value={signal.value} />
                ))}
              </div>
            </div>

            <div className="route-preview">
              <div className="overlay-label">
                <GitBranch className="h-3.5 w-3.5" />
                Leading approach
              </div>
              {primary ? (
                <>
                  <span className="route-preview-title">{PATH_BY_ID[primary].name}</span>
                  <span className="route-preview-copy">{PATH_BY_ID[primary].tagline}</span>
                </>
              ) : (
                <span className="route-preview-copy">
                  Answer two or more questions to see a recommendation.
                </span>
              )}
            </div>
          </div>

          <div className="network-shell">
            <div className="network-aura network-aura-left" />
            <div className="network-aura network-aura-right" />
            <div className="network-membrane" />
            <div className="relative z-10 h-full w-full">
              <NeuralNetwork
                state={networkState}
                activeQuestionId={activeQuestion?.id ?? null}
                primary={primary}
                alternatives={alternatives}
                compact={compactNetwork}
              />
            </div>
          </div>
        </section>

        <aside className={cn("wasabi-column", stage === "done" && "print-target")}>
          {stage === "done" ? (
            <RecommendationSummary
              recommendation={recommendation}
              onEditAnswers={editAnswers}
              onRestart={restart}
              onShare={() => {
                navigator.clipboard.writeText(window.location.href).then(() => {
                  setCopied(true)
                  setTimeout(() => setCopied(false), 2000)
                })
                track("link_shared")
              }}
              copied={copied}
            />
          ) : compactNetwork ? (
            <CompactInsightPanel
              stage={stage}
              answeredCount={answeredCount}
              recommendation={recommendation}
              strongestSignals={strongestSignals}
              onBegin={beginFlow}
            />
          ) : (
            <EmergencePanel
              stage={stage}
              answeredCount={answeredCount}
              recommendation={recommendation}
              strongestSignals={strongestSignals}
              onBegin={beginFlow}
            />
          )}
        </aside>
      </div>
    </main>
  )
}

function CompactInsightPanel({
  stage,
  answeredCount,
  recommendation,
  strongestSignals,
  onBegin,
}: {
  stage: Stage
  answeredCount: number
  recommendation: ReturnType<typeof computeRecommendation>
  strongestSignals: { label: string; value: number }[]
  onBegin: () => void
}) {
  const previewVisible = answeredCount >= 2
  const leadPath = PATH_BY_ID[recommendation.primary]

  return (
    <div className="wasabi-panel wasabi-panel-strong flex flex-col gap-3 px-4 py-4">
      <div className="flex items-center gap-3">
        <span className="section-kicker">Quick view</span>
        <div className="h-px flex-1 bg-[linear-gradient(90deg,var(--line-strong),transparent)]" />
      </div>

      {previewVisible ? (
        <>
          <div>
            <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--sprout-deep)]">
              Current recommendation
            </div>
            <div className="mt-1 text-[20px] font-semibold tracking-[-0.04em] text-foreground">
              {leadPath.name}
            </div>
            <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">
              {leadPath.tagline}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {strongestSignals.slice(0, 3).map((signal) => (
              <SignalPill key={signal.label} label={signal.label} value={signal.value} />
            ))}
          </div>
        </>
      ) : (
        <>
          <p className="text-[13px] leading-relaxed text-muted-foreground">
            Answer a couple of questions to see a recommendation.
          </p>
          {stage === "intro" && (
            <button onClick={onBegin} className="hero-cta">
              Start
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </>
      )}
    </div>
  )
}

function IntroPanel({ onBegin }: { onBegin: () => void }) {
  return (
    <div className="wasabi-panel wasabi-panel-strong flex h-full flex-col justify-between gap-8 px-5 py-6 md:px-6">
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <span className="section-kicker">About WASABI</span>
          <div className="h-px flex-1 bg-[linear-gradient(90deg,var(--line-strong),transparent)]" />
        </div>

        <div className="space-y-4">
          <h2 className="text-balance text-[34px] font-semibold leading-[1.02] tracking-[-0.05em] text-foreground md:text-[44px]">
            Figure out which AI approach fits before you build the wrong thing.
          </h2>
          <p className="text-pretty text-[15px] leading-relaxed text-muted-foreground">
            Answer eight questions about your problem. WASABI maps your answers
            to the AI approach most likely to actually work, and helps you understand why.
          </p>
        </div>

        <div className="grid gap-3">
          <FeatureStrip
            title="Watch the reasoning change as you answer"
            copy="The visualization updates in real time so you can see which approaches are getting stronger and which are being ruled out."
          />
          <FeatureStrip
            title="Plain language, not dumbed down"
            copy="Technical terms show up exactly where they're relevant, with definitions when you need them."
          />
          <FeatureStrip
            title="A recommendation and concrete next steps"
            copy="You end up with a primary approach, the alternatives worth knowing about, and specific things to do first."
          />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <button onClick={onBegin} className="hero-cta">
          Start
          <ArrowRight className="h-4 w-4" />
        </button>
        <p className="text-[12.5px] leading-relaxed text-muted-foreground">
          Takes about two minutes. You can change any answer at any time.
        </p>
      </div>
    </div>
  )
}

function EmergencePanel({
  stage,
  answeredCount,
  recommendation,
  strongestSignals,
  onBegin,
}: {
  stage: Stage
  answeredCount: number
  recommendation: ReturnType<typeof computeRecommendation>
  strongestSignals: { label: string; value: number }[]
  onBegin: () => void
}) {
  const leadPath = PATH_BY_ID[recommendation.primary]
  const previewVisible = answeredCount >= 2

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="wasabi-panel wasabi-panel-strong flex flex-col gap-4 px-5 py-5">
        <div className="flex items-center gap-3">
          <span className="section-kicker">Convergence preview</span>
          <div className="h-px flex-1 bg-[linear-gradient(90deg,var(--line-strong),transparent)]" />
        </div>

        <div className="space-y-3">
          <h2 className="text-balance text-[28px] font-semibold leading-[1.04] tracking-[-0.04em] text-foreground">
            {previewVisible
              ? "A recommendation is taking shape."
              : "Answer two or more questions to see a recommendation."}
          </h2>
          <p className="text-pretty text-[14px] leading-relaxed text-muted-foreground">
            {previewVisible
              ? "This is provisional — more answers narrow it down further."
              : "WASABI needs a minimum of two answers before it can say anything useful."}
          </p>
        </div>

        {previewVisible ? (
          <div className="rounded-[1.5rem] border border-[var(--line-soft)] bg-white/60 px-4 py-4">
            <div className="mb-2 text-[11px] uppercase tracking-[0.18em] text-[var(--sprout-deep)]">
              Current recommendation
            </div>
            <div className="text-[24px] font-semibold tracking-[-0.04em] text-foreground">
              {leadPath.name}
            </div>
            <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground">
              {leadPath.tagline}
            </p>
          </div>
        ) : (
          <button onClick={onBegin} className="hero-cta">
            Start
            <ArrowRight className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="wasabi-panel flex flex-col gap-3 px-4 py-4">
        <div className="wasabi-note-header">
          <Radar className="h-3.5 w-3.5" />
          <span>Active signals</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {strongestSignals.map((signal) => (
            <SignalPill key={signal.label} label={signal.label} value={signal.value} />
          ))}
        </div>
      </div>

      {previewVisible && (
        <div className="wasabi-panel flex flex-col gap-3 px-4 py-4">
          <div className="wasabi-note-header">
            <GitBranch className="h-3.5 w-3.5" />
            <span>Alternatives</span>
          </div>
          <div className="flex flex-col gap-2">
            {[recommendation.primary, ...recommendation.alternatives].map((pathId, index) => {
              const path = PATH_BY_ID[pathId]
              return (
                <div
                  key={pathId}
                  className={cn(
                    "rounded-[1rem] border px-3 py-3",
                    index === 0
                      ? "border-[var(--sprout)] bg-[var(--sprout-soft)]"
                      : "border-[var(--line-soft)] bg-white/55",
                  )}
                >
                  <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                    {index === 0 ? "Primary" : `Alternative ${index}`}
                  </div>
                  <div className="mt-1 text-[14px] font-medium text-foreground">
                    {path.name}
                  </div>
                  <div className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">
                    {path.tagline}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

    </div>
  )
}

function JourneyAtlas({
  answers,
  onEditAnswers,
}: {
  answers: Answers
  onEditAnswers: () => void
}) {
  const answeredItems = QUESTIONS.flatMap((question) => {
    const value = answers[question.id]
    if (Array.isArray(value)) {
      return value.map((entry) => ({
        question: question.nodeLabel,
        value: optionLabel(question.id, entry),
      }))
    }
    if (typeof value === "string") {
      return [{ question: question.nodeLabel, value: optionLabel(question.id, value) }]
    }
    return []
  })

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="wasabi-panel wasabi-panel-strong px-5 py-5">
        <div className="mb-3 flex items-center gap-3">
          <span className="section-kicker">Your answers</span>
          <div className="h-px flex-1 bg-[linear-gradient(90deg,var(--line-strong),transparent)]" />
        </div>
        <h2 className="text-[30px] font-semibold tracking-[-0.04em] text-foreground">
          Here&apos;s what you told WASABI.
        </h2>
        <p className="mt-3 text-[14px] leading-relaxed text-muted-foreground">
          These answers produced your recommendation. Go back in to change
          anything — the recommendation updates immediately.
        </p>
      </div>

      <div className="wasabi-panel flex flex-col gap-3 px-4 py-4">
        <div className="wasabi-note-header">
          <GitBranch className="h-3.5 w-3.5" />
          <span>Your answers</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {answeredItems.map((item) => (
            <span key={`${item.question}-${item.value}`} className="answer-pill">
              <span>{item.question}</span>
              <strong>{item.value}</strong>
            </span>
          ))}
        </div>
      </div>

      <button onClick={onEditAnswers} className="hero-cta mt-auto">
        Change an answer
        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  )
}

function FeatureStrip({ title, copy }: { title: string; copy: string }) {
  return (
    <div className="rounded-[1.4rem] border border-[var(--line-soft)] bg-white/55 px-4 py-4">
      <div className="text-[14px] font-medium text-foreground">{title}</div>
      <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
        {copy}
      </p>
    </div>
  )
}

function SignalPill({
  label,
  value,
}: {
  label: string
  value: number
}) {
  return (
    <div className="signal-pill">
      <span>{label}</span>
      <span className="signal-pill-meter">
        <span style={{ width: `${Math.max(12, value * 100)}%` }} />
      </span>
    </div>
  )
}

function RecommendationSummary({
  recommendation,
  onEditAnswers,
  onRestart,
  onShare,
  copied,
}: {
  recommendation: ReturnType<typeof computeRecommendation>
  onEditAnswers: () => void
  onRestart: () => void
  onShare: () => void
  copied: boolean
}) {
  const [open, setOpen] = useState(false)
  const path = PATH_BY_ID[recommendation.primary]

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex items-center gap-3">
        <span className="section-kicker">Result</span>
        <div className="h-px flex-1 bg-[linear-gradient(90deg,var(--line-strong),transparent)]" />
      </div>

      <div className="wasabi-panel wasabi-panel-strong flex flex-col gap-4 px-5 py-5">
        <div className="inline-flex w-fit items-center gap-2 rounded-full bg-[var(--sprout-soft)] px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-[var(--sprout-deep)]">
          <Sparkles className="h-3.5 w-3.5" />
          Recommendation ready
        </div>

        <div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Best fit</div>
          <h2 className="mt-1 text-[26px] font-semibold tracking-[-0.04em] text-foreground">
            {path.name}
          </h2>
          <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{path.tagline}</p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-[1rem] border border-[var(--line-soft)] bg-white/55 px-3 py-2.5">
            <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Effort</div>
            <div className="mt-0.5 text-[13px] font-medium capitalize text-foreground">{path.effort}</div>
          </div>
          <div className="rounded-[1rem] border border-[var(--line-soft)] bg-white/55 px-3 py-2.5">
            <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Risk</div>
            <div className="mt-0.5 text-[13px] font-medium capitalize text-foreground">{path.risk}</div>
          </div>
        </div>

        {recommendation.rationale.length > 0 && (
          <ul className="flex flex-col gap-1.5">
            {recommendation.rationale.slice(0, 3).map((r) => (
              <li key={r} className="flex items-start gap-2 text-[12.5px] leading-relaxed text-foreground/80">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--sprout)]" />
                {r}
              </li>
            ))}
          </ul>
        )}

        <button
          onClick={() => { setOpen(true); track("details_opened", { primary: recommendation.primary }) }}
          className="inline-flex items-center justify-center gap-2 rounded-full border border-[var(--line-soft)] bg-white/55 px-4 py-2.5 text-[13px] font-medium text-foreground transition-colors hover:border-[var(--line-strong)] hover:bg-white/75"
        >
          <Maximize2 className="h-3.5 w-3.5" />
          See full details
        </button>
      </div>

      {recommendation.alternatives.length > 0 && (
        <div className="wasabi-panel flex flex-col gap-2.5 px-4 py-4">
          <div className="overlay-label">
            <GitBranch className="h-3.5 w-3.5" />
            <span>Alternatives</span>
          </div>
          {recommendation.alternatives.map((id) => {
            const alt = PATH_BY_ID[id]
            return (
              <div key={id} className="rounded-[1rem] border border-[var(--line-soft)] bg-white/55 px-3 py-2.5">
                <div className="text-[13px] font-medium text-foreground">{alt.name}</div>
                <div className="mt-0.5 text-[11.5px] leading-relaxed text-muted-foreground">{alt.tagline}</div>
              </div>
            )
          })}
        </div>
      )}

      <div className="mt-auto flex flex-wrap gap-2">
        <button
          onClick={onShare}
          className="inline-flex items-center gap-2 rounded-full border border-[var(--line-soft)] bg-white/50 px-4 py-2 text-sm text-muted-foreground transition-colors hover:border-[var(--line-strong)] hover:text-foreground"
        >
          <ArrowRight className="h-4 w-4" />
          {copied ? "Copied!" : "Share link"}
        </button>
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 rounded-full border border-[var(--line-soft)] bg-white/50 px-4 py-2 text-sm text-muted-foreground transition-colors hover:border-[var(--line-strong)] hover:text-foreground"
        >
          <Radar className="h-4 w-4" />
          Print
        </button>
        <button
          onClick={onEditAnswers}
          className="inline-flex items-center gap-2 rounded-full border border-[var(--line-soft)] bg-white/50 px-4 py-2 text-sm text-muted-foreground transition-colors hover:border-[var(--line-strong)] hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Re-enter
        </button>
        <button
          onClick={onRestart}
          className="inline-flex items-center gap-2 rounded-full border border-[var(--line-soft)] bg-white/50 px-4 py-2 text-sm text-muted-foreground transition-colors hover:border-[var(--line-strong)] hover:text-foreground"
        >
          <RefreshCw className="h-4 w-4" />
          Restart
        </button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          style={{ maxWidth: "min(92vw, 72rem)", width: "100%" }}
          className="max-h-[90vh] overflow-y-auto p-6"
        >
          <DialogHeader>
            <DialogTitle className="text-[20px] font-semibold tracking-[-0.03em]">
              See full details
            </DialogTitle>
            <DialogDescription className="sr-only">
              Full recommendation breakdown including when this approach fits, what to avoid, and next steps.
            </DialogDescription>
          </DialogHeader>
          <RecommendationView
            recommendation={recommendation}
            onEditAnswers={() => { setOpen(false); onEditAnswers() }}
            onRestart={() => { setOpen(false); onRestart() }}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}

function collectDominantSignals(state: ReturnType<typeof computeNetworkState>) {
  const hidden1Labels = Object.fromEntries(HIDDEN_1.map((item) => [item.id, item.label]))
  const hidden2Labels = Object.fromEntries(HIDDEN_2.map((item) => [item.id, item.label]))

  return [
    ...Object.entries(state.hidden1).map(([id, value]) => ({
      label: hidden1Labels[id] ?? id,
      value,
    })),
    ...Object.entries(state.hidden2).map(([id, value]) => ({
      label: hidden2Labels[id] ?? id,
      value,
    })),
  ]
    .sort((a, b) => b.value - a.value)
    .slice(0, 5)
}

function optionLabel(questionId: string, value: string) {
  const question = QUESTIONS.find((entry) => entry.id === questionId)
  return question?.options.find((option) => option.value === value)?.label ?? value
}

function isAnsweredFor(id: string, answers: Answers) {
  const value = answers[id]
  if (Array.isArray(value)) return value.length > 0
  return value !== undefined && value !== ""
}
