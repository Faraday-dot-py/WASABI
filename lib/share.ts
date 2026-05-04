import type { Answers } from "./decision-engine/types"
import { QUESTIONS } from "./decision-engine/questions"

// Compact serialization: answers → base64url string for ?s= param.
// Format: pipe-delimited ordered values matching QUESTIONS order.
// Single-select → plain value. Multi-select → comma-joined values.
// Empty → empty string. Prefix "s1:" for format version.

const VERSION = "s1"
const Q_IDS = QUESTIONS.map((q) => q.id)

export function encodeAnswers(answers: Answers): string {
  const parts = Q_IDS.map((id) => {
    const v = answers[id]
    if (v === undefined || v === null) return ""
    if (Array.isArray(v)) return v.join(",")
    return v
  })
  const raw = `${VERSION}:${parts.join("|")}`
  return btoa(raw).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

export function decodeAnswers(encoded: string): Answers | null {
  try {
    const padded = encoded.replace(/-/g, "+").replace(/_/g, "/")
    const pad = padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4))
    const raw = atob(padded + pad)
    if (!raw.startsWith(`${VERSION}:`)) return null
    const parts = raw.slice(VERSION.length + 1).split("|")
    const answers: Answers = {}
    Q_IDS.forEach((id, i) => {
      const part = parts[i] ?? ""
      if (!part) return
      const q = QUESTIONS.find((q) => q.id === id)
      answers[id] = q?.kind === "multi" ? part.split(",") : part
    })
    return answers
  } catch {
    return null
  }
}
