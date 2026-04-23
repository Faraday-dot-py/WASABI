import type { ReactNode } from "react"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { GLOSSARY, GLOSSARY_TERMS } from "@/lib/glossary"

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

// Pre-computed at module load to avoid rebuilding per annotate() call.
const ANNOTATE_PATTERN = new RegExp(
  `\\b(${GLOSSARY_TERMS.map(escapeRegex).join("|")})\\b`,
  "gi",
)
const GLOSSARY_LOOKUP = new Map(
  GLOSSARY_TERMS.map((term) => [term.toLowerCase(), term]),
)

export function annotate(text: string): ReactNode {
  // Reset lastIndex since we reuse the compiled regex across calls.
  ANNOTATE_PATTERN.lastIndex = 0
  const pattern = ANNOTATE_PATTERN
  const parts: ReactNode[] = []
  let lastIndex = 0
  let key = 0
  let match: RegExpExecArray | null

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index))
    }

    const matched = match[0]
    const glossaryKey = GLOSSARY_LOOKUP.get(matched.toLowerCase()) ?? matched.toLowerCase()

    parts.push(
      <Tooltip key={`${matched}-${key++}`}>
        <TooltipTrigger asChild>
          <span
            className="wasabi-term"
            role="button"
            tabIndex={0}
            aria-label={`Definition for ${matched}`}
          >
            {matched}
          </span>
        </TooltipTrigger>
        <TooltipContent
          sideOffset={10}
          className="wasabi-term-tooltip [&>svg]:hidden border-none bg-transparent p-0 shadow-none"
        >
          <div className="wasabi-term-card">
            <div className="wasabi-term-title">{matched}</div>
            <p>{GLOSSARY[glossaryKey]}</p>
          </div>
        </TooltipContent>
      </Tooltip>,
    )

    lastIndex = match.index + matched.length
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex))
  }

  return <>{parts}</>
}
