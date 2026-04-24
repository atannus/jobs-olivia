"use client"

import { memo } from "react"
import { Handle, Position } from "@xyflow/react"
import { Download, Wand2 } from "lucide-react"
import { ImageUpload } from "@/components/ImageUpload"
import type { ImageNodeData } from "@/lib/types"

interface ImageNodeCardProps {
  data: ImageNodeData
}

export const ImageNodeCard = memo(function ImageNodeCard({ data }: ImageNodeCardProps) {
  return (
    <div className="w-[300px]">
      <Handle type="target" position={Position.Left} style={{ opacity: 0, pointerEvents: "none" }} />

      <div className="rounded-2xl border bg-card shadow-md overflow-hidden">
        <div className="relative w-full aspect-square bg-muted group">
          {data.status === "upload" && (
            <div className="absolute inset-0 p-3 nodrag nopan">
              <ImageUpload onImageReady={data.onImageReady} />
            </div>
          )}

          {data.status === "placeholder" && (
            <div className="absolute inset-0 m-3 rounded-xl border-2 border-dashed border-border/25 flex items-center justify-center bg-muted/20">
              <span className="text-[10px] text-muted-foreground/25 select-none uppercase tracking-widest">
                image
              </span>
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
      </div>

      <Handle type="source" position={Position.Right} style={{ opacity: 0, pointerEvents: "none" }} />
    </div>
  )
})
