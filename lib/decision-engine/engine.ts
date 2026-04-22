import { PATHS } from "./paths"
import { QUESTIONS } from "./questions"
import type { Activation, Answers, NetworkState, PathId, Recommendation } from "./types"

// ---------------------------------------------------------------------------
// Hidden-layer concept nodes.
// These are human-authored "intermediate reasoning" concepts that live
// between raw answers and build paths. They exist for both the visualization
// and for making the scoring rules readable.
// ---------------------------------------------------------------------------

export const HIDDEN_1 = [
  { id: "structured", label: "Structured" },
  { id: "linguistic", label: "Language" },
  { id: "generative", label: "Generative" },
  { id: "data-thin", label: "Data-thin" },
  { id: "constrained", label: "Constrained" },
  { id: "grounded", label: "Grounded" },
] as const

export const HIDDEN_2 = [
  { id: "rules-lean", label: "Lean" },
  { id: "classical-lean", label: "Classical" },
  { id: "pretrained-lean", label: "Pretrained" },
  { id: "retrieval-lean", label: "Retrieval" },
  { id: "adapt-lean", label: "Adapt" },
  { id: "orchestrate-lean", label: "Orchestrate" },
] as const

export type Hidden1Id = (typeof HIDDEN_1)[number]["id"]
export type Hidden2Id = (typeof HIDDEN_2)[number]["id"]

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

const clamp01 = (n: number): Activation => Math.max(0, Math.min(1, n))
const softnorm = (n: number): Activation => clamp01(n / (1 + Math.abs(n)) + 0.5 * Math.sign(n))

function has(answers: Answers, id: string, value: string): boolean {
  const a = answers[id]
  if (Array.isArray(a)) return a.includes(value)
  return a === value
}

function anyOf(answers: Answers, id: string, values: string[]): boolean {
  return values.some((v) => has(answers, id, v))
}

function isAnswered(answers: Answers, id: string): boolean {
  const a = answers[id]
  if (Array.isArray(a)) return a.length > 0
  return a !== undefined && a !== ""
}

// ---------------------------------------------------------------------------
// Hidden-1: concept activations derived from raw answers.
// Each rule adds a small amount of evidence; we then clamp.
// ---------------------------------------------------------------------------

function computeHidden1(answers: Answers): Record<Hidden1Id, Activation> {
  let structured = 0
  let linguistic = 0
  let generative = 0
  let dataThin = 0
  let constrained = 0
  let grounded = 0

  // Goal contributes to several concepts.
  if (has(answers, "goal", "predict")) structured += 0.5
  if (has(answers, "goal", "classify")) structured += 0.3
  if (has(answers, "goal", "cluster")) structured += 0.35
  if (has(answers, "goal", "explore")) structured += 0.4
  if (has(answers, "goal", "retrieve")) grounded += 0.35
  if (has(answers, "goal", "extract")) linguistic += 0.25
  if (has(answers, "goal", "generate")) generative += 0.6
  if (has(answers, "goal", "automate")) grounded += 0.2

  // Modality
  if (has(answers, "modality", "tabular")) structured += 0.6
  if (has(answers, "modality", "text")) linguistic += 0.6
  if (has(answers, "modality", "code")) linguistic += 0.4
  if (has(answers, "modality", "image")) generative += 0.1
  if (has(answers, "modality", "audio")) linguistic += 0.15
  if (has(answers, "modality", "multimodal")) {
    linguistic += 0.2
    generative += 0.15
  }

  // Data readiness
  if (has(answers, "data", "sparse")) dataThin += 0.6
  if (has(answers, "data", "messy")) dataThin += 0.3
  if (has(answers, "data", "clean-unlabeled")) dataThin += 0.2
  if (has(answers, "data", "sensitive")) constrained += 0.4
  if (has(answers, "data", "live")) grounded += 0.3

  // Labels
  if (has(answers, "labels", "none")) dataThin += 0.5
  if (has(answers, "labels", "weak")) dataThin += 0.3
  if (has(answers, "labels", "noisy")) dataThin += 0.2

  // Constraints
  if (has(answers, "constraints", "privacy")) constrained += 0.5
  if (has(answers, "constraints", "interpretability")) constrained += 0.4
  if (has(answers, "constraints", "low-latency")) constrained += 0.35
  if (has(answers, "constraints", "low-compute")) constrained += 0.35
  if (has(answers, "constraints", "high-stakes")) constrained += 0.3

  // System needs
  if (has(answers, "system", "knowledge")) grounded += 0.5
  if (has(answers, "system", "fresh")) grounded += 0.4
  if (has(answers, "system", "tools")) grounded += 0.35

  // Necessity
  if (has(answers, "necessity", "needs-reasoning")) {
    linguistic += 0.3
    generative += 0.2
  }
  if (has(answers, "necessity", "needs-learning")) structured += 0.2

  return {
    structured: clamp01(structured),
    linguistic: clamp01(linguistic),
    generative: clamp01(generative),
    "data-thin": clamp01(dataThin),
    constrained: clamp01(constrained),
    grounded: clamp01(grounded),
  }
}

// ---------------------------------------------------------------------------
// Hidden-2: "approach families" derived from hidden-1 concepts + a few
// direct answer signals (necessity, stage).
// ---------------------------------------------------------------------------

function computeHidden2(
  answers: Answers,
  h1: Record<Hidden1Id, Activation>,
): Record<Hidden2Id, Activation> {
  // "Lean" = prefer no AI / rules
  let rulesLean = 0
  if (has(answers, "necessity", "rules-fine")) rulesLean += 0.7
  if (has(answers, "necessity", "rules-maybe")) rulesLean += 0.4
  rulesLean += h1.structured * 0.2
  rulesLean -= h1.generative * 0.3
  rulesLean -= h1.linguistic * 0.2

  // Classical ML
  let classicalLean = 0
  classicalLean += h1.structured * 0.7
  classicalLean += h1.constrained * 0.3
  classicalLean -= h1.generative * 0.4
  classicalLean -= h1["data-thin"] * 0.25
  if (has(answers, "labels", "have")) classicalLean += 0.3
  if (has(answers, "labels", "can-label")) classicalLean += 0.15

  // Pretrained / prompting family
  let pretrainedLean = 0
  pretrainedLean += h1.linguistic * 0.55
  pretrainedLean += h1.generative * 0.4
  pretrainedLean += h1["data-thin"] * 0.3
  pretrainedLean -= h1.constrained * 0.25
  if (has(answers, "stage", "prototype")) pretrainedLean += 0.2
  if (has(answers, "stage", "learning")) pretrainedLean += 0.2

  // Retrieval family
  let retrievalLean = 0
  retrievalLean += h1.grounded * 0.7
  retrievalLean += h1.linguistic * 0.25
  if (has(answers, "goal", "retrieve")) retrievalLean += 0.25
  if (has(answers, "goal", "extract")) retrievalLean += 0.1

  // Adapt / fine-tune family
  let adaptLean = 0
  adaptLean += h1.constrained * 0.4
  adaptLean += h1.linguistic * 0.25
  if (has(answers, "labels", "have")) adaptLean += 0.3
  if (has(answers, "labels", "can-label")) adaptLean += 0.15
  if (has(answers, "stage", "production")) adaptLean += 0.2
  if (has(answers, "stage", "research")) adaptLean += 0.15
  adaptLean -= h1["data-thin"] * 0.4

  // Orchestrate family
  let orchestrateLean = 0
  orchestrateLean += h1.grounded * 0.4
  if (has(answers, "goal", "automate")) orchestrateLean += 0.5
  if (has(answers, "system", "tools")) orchestrateLean += 0.35
  if (has(answers, "system", "human-loop")) orchestrateLean += 0.15

  return {
    "rules-lean": clamp01(rulesLean),
    "classical-lean": clamp01(classicalLean),
    "pretrained-lean": clamp01(pretrainedLean),
    "retrieval-lean": clamp01(retrievalLean),
    "adapt-lean": clamp01(adaptLean),
    "orchestrate-lean": clamp01(orchestrateLean),
  }
}

// ---------------------------------------------------------------------------
// Path scores. These are the source of truth for the recommendation.
// Hidden-2 feeds the visual activations; direct rules guarantee
// the recommendation is defensible.
// ---------------------------------------------------------------------------

function computePathScores(
  answers: Answers,
  h1: Record<Hidden1Id, Activation>,
  h2: Record<Hidden2Id, Activation>,
): Record<PathId, number> {
  const scores: Record<PathId, number> = {
    "no-ai": 0,
    "classical-ml": 0,
    pretrained: 0,
    prompting: 0,
    rag: 0,
    "fine-tuning": 0,
    "custom-small": 0,
    agentic: 0,
  }

  // Baseline contributions from hidden-2.
  scores["no-ai"] += h2["rules-lean"] * 1.2
  scores["classical-ml"] += h2["classical-lean"] * 1.2
  scores["pretrained"] += h2["pretrained-lean"] * 0.8
  scores["prompting"] += h2["pretrained-lean"] * 1.0
  scores["rag"] += h2["retrieval-lean"] * 1.2
  scores["fine-tuning"] += h2["adapt-lean"] * 1.0
  scores["custom-small"] += h2["adapt-lean"] * 0.6 + h1.constrained * 0.4
  scores["agentic"] += h2["orchestrate-lean"] * 1.2

  // Specific direct signals that matter for correctness.

  // Privacy / on-prem strongly disfavors hosted prompting/rag,
  // and nudges toward classical or custom small.
  if (has(answers, "constraints", "privacy")) {
    scores["prompting"] -= 0.5
    scores["rag"] -= 0.3
    scores["classical-ml"] += 0.3
    scores["custom-small"] += 0.4
  }

  // Explainability disfavors big opaque models.
  if (has(answers, "constraints", "interpretability")) {
    scores["classical-ml"] += 0.4
    scores["no-ai"] += 0.3
    scores["prompting"] -= 0.3
    scores["fine-tuning"] -= 0.2
    scores["agentic"] -= 0.2
  }

  // Low latency / low compute
  if (has(answers, "constraints", "low-latency") || has(answers, "constraints", "low-compute")) {
    scores["prompting"] -= 0.2
    scores["agentic"] -= 0.3
    scores["classical-ml"] += 0.3
    scores["custom-small"] += 0.3
  }

  // Data thin
  if (has(answers, "labels", "none")) {
    scores["classical-ml"] -= 0.4
    scores["fine-tuning"] -= 0.5
    scores["custom-small"] -= 0.5
    scores["pretrained"] += 0.3
    scores["prompting"] += 0.3
  }
  if (has(answers, "data", "sparse")) {
    scores["classical-ml"] -= 0.3
    scores["fine-tuning"] -= 0.3
    scores["custom-small"] -= 0.4
  }

  // Rules-fine strongly favors no-AI.
  if (has(answers, "necessity", "rules-fine")) {
    scores["no-ai"] += 1.0
    scores["fine-tuning"] -= 0.4
    scores["custom-small"] -= 0.4
  }

  // Grounded needs push RAG.
  if (has(answers, "system", "knowledge")) scores["rag"] += 0.5
  if (has(answers, "system", "fresh")) scores["rag"] += 0.3

  // Automate + tools push agentic.
  if (has(answers, "goal", "automate")) scores["agentic"] += 0.4
  if (has(answers, "system", "tools")) scores["agentic"] += 0.3

  // Tabular + labels push classical strongly.
  if (has(answers, "modality", "tabular") && has(answers, "labels", "have")) {
    scores["classical-ml"] += 0.6
  }

  // Generation goal disfavors classical.
  if (has(answers, "goal", "generate")) {
    scores["classical-ml"] -= 0.4
    scores["no-ai"] -= 0.5
    scores["prompting"] += 0.5
  }

  // Research / publication slightly favors classical or custom-small
  if (has(answers, "stage", "research")) {
    scores["classical-ml"] += 0.15
    scores["custom-small"] += 0.15
  }

  return scores
}

// ---------------------------------------------------------------------------
// Public: full network state + recommendation from answers.
// ---------------------------------------------------------------------------

export function computeNetworkState(answers: Answers): NetworkState {
  const inputs: Record<string, Activation> = {}
  for (const q of QUESTIONS) {
    inputs[q.id] = isAnswered(answers, q.id) ? 1 : 0
  }

  const h1 = computeHidden1(answers)
  const h2 = computeHidden2(answers, h1)
  const rawScores = computePathScores(answers, h1, h2)

  // Normalize outputs into [0, 1] so the visualization has a consistent scale.
  // If nothing has been answered, keep a faint ambient activation so the
  // network never looks dead.
  const answeredCount = QUESTIONS.filter((q) => isAnswered(answers, q.id)).length
  const ambient = answeredCount === 0 ? 0.2 : 0

  const maxScore = Math.max(0.0001, ...Object.values(rawScores))
  const outputs = {} as Record<PathId, Activation>
  for (const p of PATHS) {
    const v = rawScores[p.id]
    outputs[p.id] = clamp01(Math.max(ambient, softnorm(v) * 0.4 + (v / maxScore) * 0.7))
  }

  return {
    inputs,
    hidden1: h1,
    hidden2: h2,
    outputs,
  }
}

export function computeRecommendation(answers: Answers): Recommendation {
  const state = computeNetworkState(answers)
  const h1 = state.hidden1
  const rawScoresObj = computePathScores(answers, state.hidden1, state.hidden2)

  // Top + alternatives
  const sorted = (Object.entries(rawScoresObj) as [PathId, number][]).sort(
    (a, b) => b[1] - a[1],
  )
  const primary = sorted[0][0]
  const alternatives = sorted.slice(1, 3).map(([id]) => id)

  const rationale: string[] = []
  const cautions: string[] = []

  // Build rationale deterministically from active concepts and answers.
  if (h1.structured > 0.4 && (primary === "classical-ml" || primary === "no-ai")) {
    rationale.push(
      "Your problem is structured, which is where classical and rule-based approaches consistently outperform larger models.",
    )
  }
  if (h1.linguistic > 0.4 && (primary === "prompting" || primary === "rag" || primary === "fine-tuning")) {
    rationale.push(
      "The task is language-heavy, so a language model gives you strong capability without training from scratch.",
    )
  }
  if (h1.grounded > 0.4 && (primary === "rag" || primary === "agentic")) {
    rationale.push(
      "You need grounding in specific knowledge or live data, which is exactly what retrieval and tool-using systems are for.",
    )
  }
  if (h1["data-thin"] > 0.4) {
    rationale.push(
      "You do not have strong labeled data yet, so approaches that lean on pretrained capability are safer starting points.",
    )
  }
  if (h1.constrained > 0.5) {
    rationale.push(
      "Your constraints rule out the easy hosted-model path, so the recommendation favors approaches that respect them.",
    )
  }
  if (has(answers, "goal", "automate")) {
    rationale.push(
      "Automation goals usually become systems, not single models. The recommendation reflects that.",
    )
  }

  // Cautions
  if (has(answers, "labels", "none") && (primary === "classical-ml" || primary === "fine-tuning")) {
    cautions.push(
      "You marked that you have no labels. This path usually needs them. Budget real time for labeling before modeling.",
    )
  }
  if (has(answers, "constraints", "privacy") && (primary === "prompting" || primary === "rag" || primary === "agentic")) {
    cautions.push(
      "Privacy constraints and hosted LLM usage do not automatically mix. Confirm your deployment target can meet them.",
    )
  }
  if (has(answers, "stage", "production") && primary === "agentic") {
    cautions.push(
      "Tool-using workflows are powerful but hard to make reliable in production. Start with a scripted pipeline.",
    )
  }
  if (primary === "no-ai") {
    cautions.push(
      "Do not let this feel like a downgrade. A boring, correct system is a strong result.",
    )
  }
  if (anyOf(answers, "data", ["messy", "sparse"])) {
    cautions.push(
      "Data quality will be the dominant driver of results. Invest in it before tuning models.",
    )
  }

  return {
    primary,
    alternatives,
    scores: rawScoresObj,
    rationale,
    cautions,
  }
}

// ---------------------------------------------------------------------------
// Extensibility hooks for V2 / V3.
// V2 will swap `interpretFreeformInput` with an LLM call. V3 can use these
// same scores to seed model playgrounds. Both layers stay additive.
// ---------------------------------------------------------------------------

export interface EngineHooks {
  interpretFreeformInput?: (text: string) => Promise<Partial<Answers>>
  personalizeRationale?: (rec: Recommendation, answers: Answers) => Promise<string[]>
}

export const ENGINE_VERSION = 1
