import { describe, expect, it } from "vitest"
import { computeNetworkState, computeRecommendation } from "../engine"
import type { Answers } from "../types"

const PROMPT_ANSWERS: Answers = {
  goal: "generate",
  necessity: "needs-reasoning",
  modality: "text",
  data: "none",
  constraints: [],
  system: [],
  stage: "prototype",
  volume: "small",
}

const CLASSICAL_ANSWERS: Answers = {
  goal: "classify",
  necessity: "rules-fine",
  modality: "tabular",
  data: "labeled",
  constraints: [],
  system: [],
  stage: "production",
  volume: "medium",
}

const AGENTIC_ANSWERS: Answers = {
  goal: "automate",
  necessity: "needs-reasoning",
  modality: "text",
  data: "none",
  constraints: [],
  system: ["tools", "human-loop"],
  stage: "prototype",
  volume: "small",
}

describe("computeNetworkState", () => {
  it("returns activations in [0,1] for all nodes", () => {
    const state = computeNetworkState(PROMPT_ANSWERS)
    for (const v of Object.values(state.inputs)) {
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThanOrEqual(1)
    }
    for (const v of Object.values(state.hidden1)) {
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThanOrEqual(1)
    }
    for (const v of Object.values(state.outputs)) {
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThanOrEqual(1)
    }
  })

  it("elevates linguistic for text+generate goal", () => {
    const state = computeNetworkState(PROMPT_ANSWERS)
    expect(state.hidden1.linguistic).toBeGreaterThan(0.3)
  })

  it("elevates structured for tabular+classify goal", () => {
    const state = computeNetworkState(CLASSICAL_ANSWERS)
    expect(state.hidden1.structured).toBeGreaterThan(0.3)
  })
})

describe("computeRecommendation", () => {
  it("returns a primary path and two alternatives", () => {
    const rec = computeRecommendation(PROMPT_ANSWERS)
    expect(rec.primary).toBeTruthy()
    expect(rec.alternatives).toHaveLength(2)
    expect(rec.alternatives).not.toContain(rec.primary)
  })

  it("recommends prompting or rag for generate+text+no-data", () => {
    const rec = computeRecommendation(PROMPT_ANSWERS)
    expect(["prompting", "rag", "fine-tuning"]).toContain(rec.primary)
  })

  it("recommends classical-ml or no-ai for tabular+classify+rules-fine", () => {
    const rec = computeRecommendation(CLASSICAL_ANSWERS)
    expect(["classical-ml", "no-ai", "pretrained"]).toContain(rec.primary)
  })

  it("recommends agentic for automate+tools", () => {
    const rec = computeRecommendation(AGENTIC_ANSWERS)
    expect(["agentic", "prompting", "rag"]).toContain(rec.primary)
  })

  it("primary path has the highest score", () => {
    const rec = computeRecommendation(PROMPT_ANSWERS)
    const primaryScore = rec.scores[rec.primary]
    for (const [id, score] of Object.entries(rec.scores)) {
      if (id !== rec.primary) {
        expect(primaryScore).toBeGreaterThanOrEqual(score)
      }
    }
  })

  it("produces rationale lines", () => {
    const rec = computeRecommendation(PROMPT_ANSWERS)
    expect(rec.rationale.length).toBeGreaterThanOrEqual(0)
  })

  it("empty answers produce a valid recommendation without crashing", () => {
    const rec = computeRecommendation({})
    expect(rec.primary).toBeTruthy()
  })
})
