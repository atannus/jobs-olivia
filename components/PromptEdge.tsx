"use client"

import { memo, useState } from "react"
import { BaseEdge, EdgeLabelRenderer, Position } from "@xyflow/react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import type { PromptEdgeData } from "@/lib/types"

interface PromptEdgeProps {
  id: string
  sourceX: number
  sourceY: number
  targetX: number
  targetY: number
  sourcePosition: Position
  targetPosition: Position
  markerEnd?: string
  data?: PromptEdgeData
}

/**
 * Orthogonal elbow path: exits source right, bends quickly, travels to target
 * height, bends right, arrives at target left. Label sits on the final
 * horizontal segment.
 */
function elbowPath(
  sx: number, sy: number,
  tx: number, ty: number,
  r = 20
): { path: string; labelX: number; labelY: number } {
  const dy = ty - sy
  if (Math.abs(dy) < 2) {
    return { path: `M ${sx} ${sy} H ${tx}`, labelX: (sx + tx) / 2, labelY: sy }
  }

  // Fixed short exit from source before the bend
  const elbowX = sx + 40
  // Clamp radius so arcs don't exceed available space
  const rc = Math.min(r, Math.abs(dy) / 2, Math.max(1, (tx - elbowX) / 2))

  let path: string
  if (dy < 0) {
    // Target is above source: right → up → right
    // Arc 1: right → up (left turn in screen space, sweep=0)
    // Arc 2: up   → right (right turn in screen space, sweep=1)
    path = [
      `M ${sx} ${sy}`,
      `H ${elbowX - rc}`,
      `A ${rc} ${rc} 0 0 0 ${elbowX} ${sy - rc}`,
      `V ${ty + rc}`,
      `A ${rc} ${rc} 0 0 1 ${elbowX + rc} ${ty}`,
      `H ${tx}`,
    ].join(" ")
  } else {
    // Target is below source: right → down → right
    // Arc 1: right → down (right turn in screen space, sweep=1)
    // Arc 2: down  → right (left turn in screen space, sweep=0)
    path = [
      `M ${sx} ${sy}`,
      `H ${elbowX - rc}`,
      `A ${rc} ${rc} 0 0 1 ${elbowX} ${sy + rc}`,
      `V ${ty - rc}`,
      `A ${rc} ${rc} 0 0 0 ${elbowX + rc} ${ty}`,
      `H ${tx}`,
    ].join(" ")
  }

  return {
    path,
    labelX: (elbowX + rc + tx) / 2,
    labelY: ty,
  }
}

export const PromptEdgeComponent = memo(function PromptEdgeComponent({
  sourceX,
  sourceY,
  targetX,
  targetY,
  data,
}: PromptEdgeProps) {
  const [promptText, setPromptText] = useState("")
  const isDraft = data?.status === "draft"
  const canSubmit = isDraft && promptText.trim().length > 0

  const { path: edgePath, labelX, labelY } = elbowPath(sourceX, sourceY, targetX, targetY)

  function handleSubmit() {
    if (!canSubmit || !data?.onSubmit) return
    data.onSubmit(data.childId, promptText.trim())
    setPromptText("")
  }

  return (
    <>
      <BaseEdge
        path={edgePath}
        style={{
          stroke: "color-mix(in oklch, var(--muted-foreground) 55%, transparent)",
          strokeWidth: 1.5,
          strokeDasharray: isDraft ? "6 4" : undefined,
        }}
      />

      <EdgeLabelRenderer>
        <div
          className="nodrag nopan absolute"
          style={{
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            pointerEvents: "all",
          }}
        >
          {isDraft && (
            <div className="bg-background border rounded-xl shadow-lg p-2.5 flex flex-col gap-2 w-[180px]">
              <Textarea
                rows={2}
                placeholder="Describe the scene…"
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                className="nodrag nopan resize-none text-xs p-2 min-h-0"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    handleSubmit()
                  }
                }}
              />
              <Button
                size="sm"
                className="nodrag nopan h-7 text-xs w-full"
                onClick={handleSubmit}
                disabled={!canSubmit}
              >
                Generate
              </Button>
            </div>
          )}

          {data?.status === "generating" && (
            <div className="bg-background/90 backdrop-blur-sm border rounded-lg px-2.5 py-1.5 flex items-center gap-2 shadow-sm">
              <div className="w-3 h-3 rounded-full border border-primary/30 border-t-primary animate-spin flex-shrink-0" />
              <span className="text-[10px] text-muted-foreground italic max-w-[140px] leading-relaxed">
                {data.prompt}
              </span>
            </div>
          )}

          {data?.status === "done" && data.prompt && (
            <div
              className="rounded-lg px-2.5 py-2 max-w-[180px]"
              style={{
                background: "var(--muted)",
                border: "1.5px solid color-mix(in oklch, var(--muted-foreground) 55%, transparent)",
              }}
            >
              <p className="text-[10px] text-muted-foreground italic leading-relaxed">
                {data.prompt}
              </p>
            </div>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  )
})
