import type { Answers } from "../decision-engine/types"

export interface Preset {
  id: string
  name: string
  description: string
  // Pre-filled answers — users can still change them
  answers: Partial<Answers>
}

export const PRESETS: Preset[] = [
  {
    id: "nlp-course",
    name: "NLP / LLM Course",
    description: "Starting point for students building language-based AI systems.",
    answers: {
      goal: "generate",
      necessity: "needs-reasoning",
      modality: "text",
    },
  },
  {
    id: "ml-intro",
    name: "Intro to ML",
    description: "Structured data, supervised learning, classic pipeline.",
    answers: {
      goal: "classify",
      necessity: "needs-learning",
      modality: "tabular",
    },
  },
  {
    id: "production-ai",
    name: "Production AI Systems",
    description: "Heading toward deployment with real constraints.",
    answers: {
      stage: "production",
      necessity: "needs-learning",
    },
  },
  {
    id: "no-code-ml",
    name: "No-Code / Low-Code ML",
    description: "Minimal engineering, prompt-first approach.",
    answers: {
      goal: "generate",
      necessity: "needs-reasoning",
      modality: "text",
      data: "sparse",
      stage: "prototype",
    },
  },
  {
    id: "rag-systems",
    name: "RAG & Knowledge Systems",
    description: "Grounded retrieval and knowledge base integration.",
    answers: {
      goal: "retrieve",
      necessity: "needs-reasoning",
      modality: "text",
      system: ["knowledge"],
    },
  },
]

export const PRESET_BY_ID: Record<string, Preset> = Object.fromEntries(
  PRESETS.map((p) => [p.id, p]),
)
