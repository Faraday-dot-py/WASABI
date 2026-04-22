"use client"

import { useCallback, useMemo, useState } from "react"
import { Brain, CircuitBoard, Play, RotateCcw } from "lucide-react"
import { NeuralNetwork } from "@/components/neural-network"
import { ProgressRail } from "@/components/progress-rail"
import { QuestionCard } from "@/components/question-card"
import { RecommendationView } from "@/components/recommendation-view"
import { QUESTIONS } from "@/lib/decision-engine/questions"
import { computeNetworkState, computeRecommendation } from "@/lib/decision-engine/engine"
import { PATH_BY_ID } from "@/lib/decision-engine/paths"
import type { Answers, PathId } from "@/lib/decision-engine/types"

type Stage = "intro" | "flow" | "done"

export default function Page() {
  const [stage, setStage] = useState<Stage>("intro")
  const [answers, setAnswers] = useState<Answers>({})
  const [currentIndex, setCurrentIndex] = useState(0)

  const networkState = useMemo(() => computeNetworkState(answers), [answers])
  const recommendation = useMemo(() => computeRecommendation(answers), [answers])

  const answeredCount = useMemo(
    () =>
      Object.values(answers).filter((v) =>
        Array.isArray(v) ? v.length > 0 : v !== undefined && v !== "",
      ).length,
    [answers],
  )
  const hasSignal = answeredCount >= 1
  const canShowPrimary = stage === "done" || answeredCount >= 3

  const primary = canShowPrimary ? recommendation.primary : null
  const alternatives = canShowPrimary ? recommendation.alternatives : []
  const activeQuestionId =
    stage === "flow" && currentIndex < QUESTIONS.length
      ? QUESTIONS[currentIndex].id
      : null

  // -----------------------------------------------------------------------
  // Handlers
  // -----------------------------------------------------------------------

  const setAnswer = useCallback((id: string, value: string | string[]) => {
    setAnswers((prev) => ({ ...prev, [id]: value }))
  }, [])

  const nextStep = useCallback(() => {
    setCurrentIndex((i) => {
      const next = i + 1
      if (next >= QUESTIONS.length) {
        setStage("done")
        return QUESTIONS.length - 1
      }
      return next
    })
  }, [])

  const prevStep = useCallback(() => {
    setCurrentIndex((i) => Math.max(0, i - 1))
  }, [])

  const jumpTo = useCallback((i: number) => {
    setStage("flow")
    setCurrentIndex(Math.max(0, Math.min(QUESTIONS.length - 1, i)))
  }, [])

  const beginFlow = useCallback(() => {
    setStage("flow")
    setCurrentIndex(0)
  }, [])

  const editAnswers = useCallback(() => {
    setStage("flow")
    setCurrentIndex(QUESTIONS.length - 1)
  }, [])

  const restart = useCallback(() => {
    setAnswers({})
    setCurrentIndex(0)
    setStage("intro")
  }, [])

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  return (
    <main className="relative flex min-h-[100dvh] flex-col">
      <TopBar
        answeredCount={answeredCount}
        totalQuestions={QUESTIONS.length}
        stage={stage}
        onRestart={restart}
      />

      <div className="flex flex-1 flex-col lg:flex-row">
        {/* LEFT: content (intro / flow / recommendation) */}
        <section className="order-2 flex w-full flex-col border-t border-border/60 lg:order-1 lg:w-[42%] lg:max-w-[620px] lg:border-r lg:border-t-0">
          <div className="flex flex-1 flex-col px-5 py-6 md:px-8 md:py-8">
            {stage === "intro" && <IntroPanel onBegin={beginFlow} />}

            {stage === "flow" && (
              <div className="flex flex-1 flex-col gap-6">
                <ProgressRail
                  currentIndex={currentIndex}
                  answers={answers}
                  onJump={jumpTo}
                />
                <div className="h-px w-full bg-border/60" />
                <div className="flex flex-1 flex-col">
                  <QuestionCard
                    question={QUESTIONS[currentIndex]}
                    index={currentIndex}
                    total={QUESTIONS.length}
                    answer={answers[QUESTIONS[currentIndex].id] as string | string[] | undefined}
                    onAnswer={(v) => setAnswer(QUESTIONS[currentIndex].id, v)}
                    onNext={nextStep}
                    onBack={prevStep}
                    canGoBack={currentIndex > 0}
                    canGoNext={isAnsweredFor(QUESTIONS[currentIndex].id, answers)}
                  />
                </div>
              </div>
            )}

            {stage === "done" && (
              <RecommendationView
                recommendation={recommendation}
                onEditAnswers={editAnswers}
                onRestart={restart}
              />
            )}
          </div>
        </section>

        {/* RIGHT: neural network */}
        <section className="relative order-1 flex h-[56vh] w-full flex-1 lg:order-2 lg:h-auto lg:min-h-[calc(100dvh-57px)]">
          <div className="pointer-events-none absolute inset-0 bg-grid opacity-40" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,oklch(0.14_0.012_245)_85%)]" />
          <NetworkLegend
            hasSignal={hasSignal}
            primaryName={canShowPrimary ? pathName(recommendation.primary) : undefined}
          />
          <div className="relative flex h-full w-full items-center justify-center p-4 md:p-6">
            <NeuralNetwork
              state={networkState}
              activeQuestionId={activeQuestionId}
              primary={primary}
              alternatives={alternatives}
            />
          </div>
        </section>
      </div>
    </main>
  )
}

// -----------------------------------------------------------------------------
// Top bar
// -----------------------------------------------------------------------------

function TopBar({
  answeredCount,
  totalQuestions,
  stage,
  onRestart,
}: {
  answeredCount: number
  totalQuestions: number
  stage: Stage
  onRestart: () => void
}) {
  const pct = Math.round((answeredCount / totalQuestions) * 100)
  return (
    <header className="relative z-10 flex items-center justify-between gap-3 border-b border-border/60 bg-background/80 px-5 py-3 backdrop-blur-md md:px-8">
      <div className="flex items-center gap-2.5">
        <div className="flex h-7 w-7 items-center justify-center rounded-md border border-primary/40 bg-primary/10 shadow-[inset_0_0_12px_oklch(0.78_0.15_205_/_0.3)]">
          <CircuitBoard className="h-3.5 w-3.5 text-primary" />
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-[13px] font-semibold tracking-tight">Neuralpath</span>
          <span className="font-mono text-[9.5px] uppercase tracking-[0.2em] text-muted-foreground">
            AI / ML decision compass
          </span>
        </div>
      </div>

      <div className="hidden items-center gap-3 md:flex">
        <div className="flex items-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.22em] text-muted-foreground">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
          {stage === "done"
            ? "signal resolved"
            : stage === "flow"
              ? "computing..."
              : "standby"}
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10.5px] text-muted-foreground">
            {answeredCount}/{totalQuestions}
          </span>
          <div className="h-1 w-24 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-primary transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>

      <button
        onClick={onRestart}
        className="inline-flex items-center gap-1.5 rounded-md border border-border/70 bg-transparent px-2.5 py-1.5 text-[12px] text-muted-foreground transition-colors hover:border-border hover:text-foreground"
      >
        <RotateCcw className="h-3 w-3" />
        Reset
      </button>
    </header>
  )
}

// -----------------------------------------------------------------------------
// Intro panel
// -----------------------------------------------------------------------------

function IntroPanel({ onBegin }: { onBegin: () => void }) {
  return (
    <div className="flex h-full flex-col justify-center gap-6 animate-in fade-in slide-in-from-bottom-3 duration-700">
      <div className="flex items-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.24em] text-primary/90">
        <Brain className="h-3 w-3" />
        an interactive guide
      </div>
      <h1 className="text-pretty text-[34px] font-semibold leading-[1.1] tracking-tight text-foreground md:text-[44px]">
        Find your starting point in AI and machine learning.
      </h1>
      <p className="text-pretty text-[15px] leading-relaxed text-muted-foreground md:text-[16px]">
        Answer a short sequence of questions about your goal, your data, and
        your constraints. The network on the right reacts in real time, shaping
        itself around your answers and converging on a recommended path.
      </p>

      <div className="flex flex-col gap-2 rounded-xl border border-border/60 bg-card/40 p-4">
        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          what you&apos;ll get
        </div>
        <ul className="flex flex-col gap-1.5 text-[13.5px] leading-relaxed text-foreground/90">
          <li className="flex gap-2">
            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" />
            A recommended build path, with the tradeoffs that come with it
          </li>
          <li className="flex gap-2">
            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" />
            A realistic first prototype and evaluation plan
          </li>
          <li className="flex gap-2">
            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" />
            Alternative paths you can compare on the same page
          </li>
        </ul>
      </div>

      <div>
        <button
          onClick={onBegin}
          className="group inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 text-[14px] font-semibold text-primary-foreground transition-all hover:brightness-110 shadow-[0_0_0_1px_oklch(0.78_0.15_205_/_0.45),_0_10px_40px_-10px_oklch(0.78_0.15_205_/_0.6)]"
        >
          <Play className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          Begin the flow
        </button>
      </div>

      <p className="text-[12px] leading-relaxed text-muted-foreground">
        Takes about two minutes. You can revisit any answer at any time. The
        network reflects real decision logic, not decoration.
      </p>
    </div>
  )
}

// -----------------------------------------------------------------------------
// Floating legend over the network
// -----------------------------------------------------------------------------

function NetworkLegend({
  hasSignal,
  primaryName,
}: {
  hasSignal: boolean
  primaryName?: string
}) {
  return (
    <div className="pointer-events-none absolute left-4 top-4 z-10 flex flex-col gap-1.5 md:left-6 md:top-6">
      <div className="flex items-center gap-2 rounded-full border border-border/60 bg-background/70 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground backdrop-blur-md">
        <span
          className={`h-1.5 w-1.5 rounded-full ${
            hasSignal ? "bg-primary animate-pulse" : "bg-muted-foreground/40"
          }`}
        />
        {hasSignal ? "propagating signal" : "awaiting input"}
      </div>
      {primaryName && (
        <div className="flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/5 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.22em] text-amber-200/90 backdrop-blur-md">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
          converging: {primaryName}
        </div>
      )}
    </div>
  )
}

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

function isAnsweredFor(id: string, answers: Answers) {
  const a = answers[id]
  if (Array.isArray(a)) return a.length > 0
  return a !== undefined && a !== ""
}

function pathName(id: PathId): string {
  return PATH_BY_ID[id].name
}
