// Core types for the decision engine.
// Kept intentionally small and serializable so V2 (LLM interpretation)
// and V3 (live model demos) can extend this layer without a rewrite.

export type OptionValue = string

export type QuestionKind = "single" | "multi"

export interface QuestionOption {
  value: OptionValue
  label: string
  // short inline explanation shown on hover / focus
  hint?: string
}

export interface Question {
  id: string
  // short label shown on the input node in the neural network
  nodeLabel: string
  title: string
  subtitle?: string
  kind: QuestionKind
  options: QuestionOption[]
  // one-line contextual "why this matters"
  why: string
  // for multi-select: values that clear all other selections when chosen (and vice versa)
  exclusiveValues?: OptionValue[]
}

export type Answers = Record<string, OptionValue | OptionValue[] | undefined>

export type PathId =
  | "no-ai"
  | "classical-ml"
  | "pretrained"
  | "prompting"
  | "rag"
  | "fine-tuning"
  | "custom-small"
  | "agentic"

export interface BuildPath {
  id: PathId
  name: string
  tagline: string
  summary: string
  whenItFits: string[]
  avoidWhen: string[]
  dataImplications: string
  effort: "low" | "moderate" | "high"
  risk: "low" | "moderate" | "high"
  firstPrototype: string
  evaluation: string
  nextSteps: string[]
}

// A single numeric activation in [0, 1] used by the visualization AND
// the recommendation engine. Keeping them identical is what makes the
// network feel honest instead of decorative.
export type Activation = number

export interface NetworkState {
  inputs: Record<string, Activation> // keyed by question id
  hidden1: Record<string, Activation>
  hidden2: Record<string, Activation>
  outputs: Record<PathId, Activation>
}

export interface Recommendation {
  primary: PathId
  alternatives: PathId[]
  scores: Record<PathId, number>
  // human-readable justification lines, generated deterministically in V1
  rationale: string[]
  cautions: string[]
}
