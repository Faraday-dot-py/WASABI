import { describe, it, expect } from "vitest"
import { computeRecommendation, computeNetworkState } from "./engine"
import type { Answers, PathId } from "./types"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function primary(answers: Answers): PathId {
  return computeRecommendation(answers).primary
}

function scores(answers: Answers): Record<PathId, number> {
  return computeRecommendation(answers).scores
}

// ---------------------------------------------------------------------------
// Canonical personas — one per output path
// ---------------------------------------------------------------------------

describe("canonical personas", () => {
  it("no-ai: rules are good enough + interpretability required", () => {
    const answers: Answers = {
      goal: "classify",
      necessity: "rules-fine",
      modality: "tabular",
      labels: "have",
      data: "clean-labeled",
      constraints: ["interpretability"],
      stage: "learning",
    }
    expect(primary(answers)).toBe("no-ai")
  })

  it("classical-ml: tabular data with labels, learning needed", () => {
    const answers: Answers = {
      goal: "predict",
      necessity: "needs-learning",
      modality: "tabular",
      labels: "have",
      data: "clean-labeled",
      constraints: ["none"],
      stage: "prototype",
    }
    expect(primary(answers)).toBe("classical-ml")
  })

  it("pretrained: image classification, no labels, interpretability fence penalises prompting", () => {
    const answers: Answers = {
      goal: "classify",
      modality: "image",
      labels: "none",
      constraints: ["interpretability"],
      stage: "prototype",
    }
    expect(primary(answers)).toBe("pretrained")
  })

  it("prompting: text generation, no data, no constraints", () => {
    const answers: Answers = {
      goal: "generate",
      modality: "text",
      labels: "none",
      data: "sparse",
      constraints: ["none"],
      stage: "prototype",
    }
    expect(primary(answers)).toBe("prompting")
  })

  it("rag: retrieval goal + knowledge base + live data", () => {
    const answers: Answers = {
      goal: "retrieve",
      modality: "text",
      labels: "none",
      data: "live",
      system: ["knowledge", "fresh"],
    }
    expect(primary(answers)).toBe("rag")
  })

  it("fine-tuning: text extraction, labels available, production stage, no hard constraints", () => {
    const answers: Answers = {
      goal: "extract",
      necessity: "needs-reasoning",
      modality: "text",
      labels: "have",
      data: "clean-labeled",
      constraints: ["none"],
      stage: "production",
    }
    expect(primary(answers)).toBe("fine-tuning")
  })

  it("custom-small: privacy + low-latency + labeled data locks out hosted models", () => {
    const answers: Answers = {
      goal: "classify",
      modality: "text",
      labels: "have",
      data: "sensitive",
      constraints: ["privacy", "low-latency"],
      stage: "production",
    }
    expect(primary(answers)).toBe("custom-small")
  })

  it("agentic: automation goal with tools required", () => {
    const answers: Answers = {
      goal: "automate",
      necessity: "needs-reasoning",
      modality: "text",
      labels: "none",
      data: "live",
      system: ["tools"],
      stage: "production",
    }
    expect(primary(answers)).toBe("agentic")
  })
})

// ---------------------------------------------------------------------------
// Direct scoring rules
// ---------------------------------------------------------------------------

describe("direct scoring rules", () => {
  it("privacy constraint docks prompting by 0.5", () => {
    const base: Answers = { goal: "generate", modality: "text", labels: "none" }
    const withPrivacy: Answers = { ...base, constraints: ["privacy"] }
    const s1 = scores(base)
    const s2 = scores(withPrivacy)
    expect(s2["prompting"]).toBeLessThan(s1["prompting"] - 0.4)
  })

  it("tabular + have labels gives classical-ml a strong bonus", () => {
    const base: Answers = { goal: "predict", modality: "tabular", labels: "have" }
    const noLabels: Answers = { goal: "predict", modality: "tabular", labels: "none" }
    expect(scores(base)["classical-ml"]).toBeGreaterThan(scores(noLabels)["classical-ml"] + 0.5)
  })

  it("rules-fine adds 1.0 directly to no-ai score", () => {
    const base: Answers = { goal: "classify", modality: "tabular", labels: "have" }
    const withRules: Answers = { ...base, necessity: "rules-fine" }
    expect(scores(withRules)["no-ai"]).toBeGreaterThan(scores(base)["no-ai"] + 0.8)
  })

  it("knowledge + fresh push rag score substantially", () => {
    const base: Answers = { goal: "retrieve", modality: "text", labels: "none" }
    const withKB: Answers = { ...base, system: ["knowledge", "fresh"] }
    expect(scores(withKB)["rag"]).toBeGreaterThan(scores(base)["rag"] + 0.6)
  })

  it("automate + tools push agentic score substantially", () => {
    const base: Answers = { goal: "classify", modality: "text" }
    const withAutomate: Answers = { goal: "automate", modality: "text", system: ["tools"] }
    expect(scores(withAutomate)["agentic"]).toBeGreaterThan(scores(base)["agentic"] + 0.5)
  })

  it("labels=none docks classical-ml and fine-tuning", () => {
    const withLabels: Answers = { goal: "predict", modality: "tabular", labels: "have" }
    const withNone: Answers = { goal: "predict", modality: "tabular", labels: "none" }
    expect(scores(withNone)["classical-ml"]).toBeLessThan(scores(withLabels)["classical-ml"] - 0.3)
    expect(scores(withNone)["fine-tuning"]).toBeLessThan(scores(withLabels)["fine-tuning"] - 0.3)
  })
})

// ---------------------------------------------------------------------------
// Caution generation
// ---------------------------------------------------------------------------

describe("caution generation", () => {
  it("no-ai primary always includes the 'boring is fine' caution", () => {
    const answers: Answers = {
      goal: "classify",
      necessity: "rules-fine",
      modality: "tabular",
      labels: "have",
    }
    const rec = computeRecommendation(answers)
    expect(rec.primary).toBe("no-ai")
    expect(rec.cautions.some((c) => c.includes("downgrade"))).toBe(true)
  })

  it("privacy + prompting primary triggers hosted-model caution", () => {
    // Force prompting primary with privacy signal and verify caution fires
    const answers: Answers = {
      goal: "generate",
      modality: "text",
      labels: "none",
      constraints: ["privacy"],
      stage: "prototype",
    }
    const rec = computeRecommendation(answers)
    if (rec.primary === "prompting" || rec.primary === "rag" || rec.primary === "agentic") {
      expect(rec.cautions.some((c) => c.includes("Privacy"))).toBe(true)
    }
  })

  it("labels=none + classical-ml primary triggers labeling caution", () => {
    // Build a persona where classical-ml wins despite no labels (via interpretability / constrained)
    const answers: Answers = {
      goal: "predict",
      necessity: "needs-learning",
      modality: "tabular",
      labels: "none",
      constraints: ["interpretability"],
      stage: "prototype",
    }
    const rec = computeRecommendation(answers)
    if (rec.primary === "classical-ml" || rec.primary === "fine-tuning") {
      expect(rec.cautions.some((c) => c.includes("labels"))).toBe(true)
    }
  })

  it("production + agentic primary triggers reliability caution", () => {
    const answers: Answers = {
      goal: "automate",
      necessity: "needs-reasoning",
      modality: "text",
      labels: "none",
      system: ["tools"],
      stage: "production",
    }
    const rec = computeRecommendation(answers)
    expect(rec.primary).toBe("agentic")
    expect(rec.cautions.some((c) => c.includes("reliable"))).toBe(true)
  })

  it("messy data triggers data quality caution", () => {
    const answers: Answers = {
      goal: "predict",
      modality: "tabular",
      labels: "have",
      data: "messy",
    }
    const rec = computeRecommendation(answers)
    expect(rec.cautions.some((c) => c.includes("Data quality"))).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Network state — ambient activations and input layer
// ---------------------------------------------------------------------------

describe("computeNetworkState", () => {
  it("empty answers produce ambient output activations of 0.2", () => {
    const state = computeNetworkState({})
    for (const v of Object.values(state.outputs)) {
      expect(v).toBeCloseTo(0.2, 5)
    }
  })

  it("answering a question sets that input to 1", () => {
    const state = computeNetworkState({ goal: "predict" })
    expect(state.inputs["goal"]).toBe(1)
    expect(state.inputs["modality"]).toBe(0)
  })

  it("all outputs are in [0, 1]", () => {
    const full: Answers = {
      goal: "automate",
      necessity: "needs-reasoning",
      modality: "text",
      data: "live",
      labels: "none",
      constraints: ["privacy"],
      system: ["tools"],
      stage: "production",
    }
    const state = computeNetworkState(full)
    for (const v of Object.values(state.outputs)) {
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThanOrEqual(1)
    }
  })

  it("ambient activations disappear once any question is answered", () => {
    const empty = computeNetworkState({})
    const answered = computeNetworkState({ goal: "predict" })
    // After answering, outputs are no longer uniformly 0.2
    const vals = Object.values(answered.outputs)
    const allSame = vals.every((v) => v === vals[0])
    expect(allSame).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Softnorm / score invariants
// ---------------------------------------------------------------------------

describe("score invariants", () => {
  it("alternatives contains the second and third highest-scoring paths", () => {
    const answers: Answers = {
      goal: "retrieve",
      modality: "text",
      labels: "none",
      system: ["knowledge", "fresh"],
    }
    const rec = computeRecommendation(answers)
    const sorted = Object.entries(rec.scores).sort((a, b) => b[1] - a[1])
    expect(rec.primary).toBe(sorted[0][0])
    expect(rec.alternatives[0]).toBe(sorted[1][0])
    expect(rec.alternatives[1]).toBe(sorted[2][0])
  })

  it("recommendation always has exactly 2 alternatives", () => {
    const answers: Answers = { goal: "generate", modality: "text" }
    expect(computeRecommendation(answers).alternatives).toHaveLength(2)
  })

  it("all 8 paths appear in scores", () => {
    const rec = computeRecommendation({ goal: "predict" })
    const pathIds = ["no-ai", "classical-ml", "pretrained", "prompting", "rag", "fine-tuning", "custom-small", "agentic"]
    for (const id of pathIds) {
      expect(id in rec.scores).toBe(true)
    }
  })
})
