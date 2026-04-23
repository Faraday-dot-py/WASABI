"use client"

import { useEffect } from "react"
import { RotateCcw } from "lucide-react"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex h-dvh flex-col items-center justify-center gap-4 text-center px-6">
      <p className="text-[15px] text-muted-foreground">
        Something went wrong in the WASABI environment.
      </p>
      <button
        onClick={reset}
        className="inline-flex items-center gap-2 rounded-full border border-[var(--line-soft)] bg-white/50 px-4 py-2 text-sm text-muted-foreground transition-colors hover:border-[var(--line-strong)] hover:text-foreground"
      >
        <RotateCcw className="h-3.5 w-3.5" />
        Try again
      </button>
    </div>
  )
}
