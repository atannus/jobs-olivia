"use client"

import { useEffect, useRef } from "react"
import { Download, Loader2, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
// Retired component — type defined locally to avoid coupling to current lib/types
interface IterationStep {
  id: string
  imageB64: string
  mimeType: string
  isOriginal: boolean
  prompt?: string
  improvedPrompt?: string
}

interface ImageTimelineProps {
  steps: IterationStep[]
  generating: boolean
  pendingPrompt: string | null
}

function StepCard({ step }: { step: IterationStep }) {
  const src = step.isOriginal
    ? `data:${step.mimeType};base64,${step.imageB64}`
    : `data:image/png;base64,${step.imageB64}`

  function handleDownload() {
    const a = document.createElement("a")
    a.href = src
    a.download = step.isOriginal ? "original.jpg" : "generated.png"
    a.click()
  }

  return (
    <div className="flex-none flex flex-col gap-2">
      <div
        className="relative rounded-xl overflow-hidden bg-muted group"
        style={{ maxHeight: 520, maxWidth: 520 }}
      >
        <img
          src={src}
          alt={step.isOriginal ? "Original" : "Generated"}
          className="block object-contain"
          style={{ maxHeight: 520, maxWidth: 520, minWidth: 240 }}
          draggable={false}
        />
        {!step.isOriginal && (
          <button
            onClick={handleDownload}
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 hover:bg-black/80 rounded-lg p-1.5"
            title="Download"
          >
            <Download className="w-3.5 h-3.5 text-white" />
          </button>
        )}
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/40 to-transparent px-3 py-2">
          <span className="text-[10px] font-medium text-white/90 uppercase tracking-wider">
            {step.isOriginal ? "Reference" : "Generated"}
          </span>
        </div>
      </div>

      {step.improvedPrompt && (
        <p className="text-[10px] text-muted-foreground italic max-w-[520px] line-clamp-2 leading-relaxed px-1">
          {step.improvedPrompt}
        </p>
      )}
    </div>
  )
}

function StepArrow({ prompt, loading }: { prompt: string; loading?: boolean }) {
  return (
    <div className="flex-none flex flex-col items-center justify-center gap-2 px-2 self-start mt-[calc(260px-3rem)]">
      <p className="text-[11px] text-center text-muted-foreground italic max-w-[120px] leading-snug line-clamp-4">
        {prompt}
      </p>
      <div className="flex items-center gap-0.5 text-muted-foreground">
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <ArrowRight className="w-5 h-5" />
        )}
      </div>
    </div>
  )
}

export function ImageTimeline({ steps, generating, pendingPrompt }: ImageTimelineProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ left: scrollRef.current.scrollWidth, behavior: "smooth" })
    }
  }, [steps.length, generating])

  const isEmpty = steps.length === 0

  return (
    <div className="h-full w-full overflow-hidden flex flex-col">
      {isEmpty ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-muted-foreground select-none">
          <div className="space-y-1 text-center">
            <p className="text-sm font-medium">Upload a product image to begin</p>
            <p className="text-xs">Your ad variations will appear here</p>
          </div>
        </div>
      ) : (
        <div
          ref={scrollRef}
          className="flex-1 flex items-start gap-0 overflow-x-auto px-8 pt-8 pb-6"
          style={{ scrollbarWidth: "thin" }}
        >
          {steps.map((step, i) => (
            <div key={step.id} className="flex items-start gap-0">
              {i > 0 && (
                <StepArrow prompt={step.prompt ?? ""} />
              )}
              <StepCard step={step} />
            </div>
          ))}

          {generating && pendingPrompt && (
            <>
              <StepArrow prompt={pendingPrompt} loading />
              <div
                className="flex-none rounded-xl bg-muted animate-pulse"
                style={{ width: 340, height: 340, minWidth: 240 }}
              />
            </>
          )}
        </div>
      )}
    </div>
  )
}
