import { describe, expect, it } from "vitest"
import { GLOSSARY, GLOSSARY_TERMS } from "../glossary"

describe("GLOSSARY", () => {
  it("has at least 5 terms", () => {
    expect(Object.keys(GLOSSARY).length).toBeGreaterThanOrEqual(5)
  })

  it("all keys are lowercase", () => {
    for (const key of Object.keys(GLOSSARY)) {
      expect(key).toBe(key.toLowerCase())
    }
  })

  it("all definitions are non-empty strings", () => {
    for (const [term, def] of Object.entries(GLOSSARY)) {
      expect(typeof def).toBe("string")
      expect(def.length).toBeGreaterThan(0)
      expect(def.trim()).toBe(def) // no leading/trailing whitespace
    }
  })
})

describe("GLOSSARY_TERMS", () => {
  it("is sorted longest-first", () => {
    for (let i = 0; i < GLOSSARY_TERMS.length - 1; i++) {
      expect(GLOSSARY_TERMS[i].length).toBeGreaterThanOrEqual(GLOSSARY_TERMS[i + 1].length)
    }
  })

  it("matches GLOSSARY keys exactly", () => {
    const glossaryKeys = new Set(Object.keys(GLOSSARY))
    for (const term of GLOSSARY_TERMS) {
      expect(glossaryKeys.has(term)).toBe(true)
    }
    expect(GLOSSARY_TERMS.length).toBe(glossaryKeys.size)
  })
})
