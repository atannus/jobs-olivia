"use client"

import { useState, memo } from "react"
import { Handle, Position } from "@xyflow/react"
import { ArrowRight, Download, Wand2 } from "lucide-react"
import { ImageUpload } from "@/components/ImageUpload"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import type { ImageNodeData } from "@/lib/types"

interface ImageNodeCardProps {
  id: string
  data: ImageNodeData
}

export const ImageNodeCard = memo(function ImageNodeCard({
  id,
  data,
}: ImageNodeCardProps) {
  const [promptText, setPromptText] = useState("")
  const canSubmit = (data.status === "ready" || data.status === "done") && promptText.trim().length > 0
  const showPromptZone = data.status === "ready" || data.status === "done"

  function handleSubmit() {
    if (!canSubmit) return
    data.onGenerate(id, promptText.trim())
    setPromptText("")
  }

  return (
    <div className="flex items-start">
      <Handle
        type="target"
        position={Position.Left}
        style={{ opacity: 0, pointerEvents: "none" }}
      />

      {/* Card */}
      <div className="w-[300px] rounded-2xl border bg-card shadow-md overflow-hidden">
        <div className="relative w-full aspect-square bg-muted group">
          {data.status === "upload" && (
            <div className="absolute inset-0 p-3 nodrag nopan">
              <ImageUpload onImageReady={data.onImageReady} />
            </div>
          )}

          {(data.status === "ready" || data.status === "done") && data.imageB64 && (
            <>
              <img
                src={`data:${data.mimeType ?? "image/jpeg"};base64,${data.imageB64}`}
                alt={data.isSource ? "Source product" : "Generated ad"}
                className="w-full h-full object-contain"
                draggable={false}
              />
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/50 to-transparent px-3 py-2 pointer-events-none">
                <span className="text-[10px] font-medium uppercase tracking-wider text-white/90">
                  {data.isSource
                    ? `Reference${data.productType ? ` · ${data.productType}` : ""}`
                    : "Generated"}
                </span>
              </div>
              {!data.isSource && (
                <button
                  className="nodrag nopan absolute top-2 right-2 bg-black/50 hover:bg-black/70 rounded-lg p-1.5 transition-all opacity-0 group-hover:opacity-100"
                  onClick={() => {
                    const a = document.createElement("a")
                    a.href = `data:image/png;base64,${data.imageB64}`
                    a.download = "generated.png"
                    a.click()
                  }}
                  title="Download"
                >
                  <Download className="w-3.5 h-3.5 text-white" />
                </button>
              )}
            </>
          )}

          {data.status === "loading" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-muted">
              <div className="w-8 h-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
              <span className="text-xs text-muted-foreground">Generating…</span>
            </div>
          )}

          {data.status === "error" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center">
              <span className="text-sm font-medium text-destructive">Failed</span>
              <span className="text-xs text-muted-foreground leading-snug">{data.errorMessage}</span>
            </div>
          )}
        </div>

        {data.improvedPrompt && (
          <div className="px-3 py-2 border-t flex items-start gap-1.5 bg-muted/30">
            <Wand2 className="w-3 h-3 shrink-0 mt-0.5 text-muted-foreground" />
            <p className="text-[10px] italic text-muted-foreground leading-relaxed line-clamp-2">
              {data.improvedPrompt}
            </p>
          </div>
        )}

        {data.isSource && data.suggestedPrompts && data.suggestedPrompts.length > 0 && (
          <div className="px-3 py-2.5 border-t space-y-1.5">
            <p className="text-[9px] uppercase tracking-widest text-muted-foreground mb-1">
              Suggested scenes
            </p>
            {data.suggestedPrompts.map((p, i) => (
              <button
                key={i}
                className="nodrag nopan w-full text-left text-xs px-2.5 py-1.5 rounded-lg bg-muted hover:bg-accent transition-colors leading-snug"
                onClick={() => data.onGenerate(id, p)}
              >
                {p}
              </button>
            ))}
          </div>
        )}
      </div>

      {showPromptZone && (
        <div className="flex items-start gap-3 ml-4 mt-4">
          <div className="w-[200px] flex flex-col gap-2 nodrag nopan">
            <Textarea
              rows={3}
              placeholder="Describe the scene…"
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              className="nodrag nopan resize-none text-sm"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  handleSubmit()
                }
              }}
            />
            <Button
              size="sm"
              className="nodrag nopan w-full"
              onClick={handleSubmit}
              disabled={!canSubmit}
            >
              Generate
            </Button>
          </div>

          <div className="flex-shrink-0 mt-10 text-muted-foreground/50">
            <ArrowRight className="w-5 h-5" />
          </div>

          <div className="w-[300px] aspect-square rounded-2xl border-2 border-dashed border-border/50 flex items-center justify-center bg-muted/20 flex-shrink-0">
            <span className="text-xs text-muted-foreground/30 text-center leading-relaxed">
              generated<br />image
            </span>
          </div>
        </div>
      )}

      <Handle
        type="source"
        position={Position.Right}
        style={{ opacity: 0, pointerEvents: "none" }}
      />
    </div>
  )
})
