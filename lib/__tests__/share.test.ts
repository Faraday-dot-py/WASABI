import { describe, expect, it } from "vitest"
import { decodeAnswers, encodeAnswers } from "../share"
import type { Answers } from "../decision-engine/types"

const FULL_ANSWERS: Answers = {
  goal: "generate",
  necessity: "needs-reasoning",
  modality: "text",
  data: "sparse",
  labels: "none",
  constraints: ["privacy", "high-stakes"],
  system: ["knowledge", "tools"],
  stage: "prototype",
}

describe("encodeAnswers / decodeAnswers", () => {
  it("round-trips a full answer set", () => {
    const encoded = encodeAnswers(FULL_ANSWERS)
    const decoded = decodeAnswers(encoded)
    expect(decoded).toMatchObject(FULL_ANSWERS)
  })

  it("round-trips empty answers", () => {
    const encoded = encodeAnswers({})
    const decoded = decodeAnswers(encoded)
    expect(decoded).toEqual({})
  })

  it("returns null for invalid input", () => {
    expect(decodeAnswers("not-valid-base64!!!")).toBeNull()
    expect(decodeAnswers("aGVsbG8=")).toBeNull() // valid base64, wrong prefix
  })

  it("produces a URL-safe string (no +, /, =)", () => {
    const encoded = encodeAnswers(FULL_ANSWERS)
    expect(encoded).not.toContain("+")
    expect(encoded).not.toContain("/")
    expect(encoded).not.toContain("=")
  })

  it("preserves multi-select arrays", () => {
    const decoded = decodeAnswers(encodeAnswers(FULL_ANSWERS))
    expect(decoded?.constraints).toEqual(["privacy", "high-stakes"])
    expect(decoded?.system).toEqual(["knowledge", "tools"])
  })

  it("partial answers round-trip correctly", () => {
    const partial: Answers = { goal: "classify", necessity: "rules-fine", stage: "production" }
    const decoded = decodeAnswers(encodeAnswers(partial))
    expect(decoded?.goal).toBe("classify")
    expect(decoded?.necessity).toBe("rules-fine")
    expect(decoded?.stage).toBe("production")
    expect(decoded?.modality).toBeUndefined()
  })
})
