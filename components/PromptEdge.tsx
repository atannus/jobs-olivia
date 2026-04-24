"use client"

import { memo, useState } from "react"
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  Position,
} from "@xyflow/react"
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

export const PromptEdgeComponent = memo(function PromptEdgeComponent({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
  data,
}: PromptEdgeProps) {
  const [promptText, setPromptText] = useState("")
  const isDraft = data?.status === "draft"
  const canSubmit = isDraft && promptText.trim().length > 0

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  })

  function handleSubmit() {
    if (!canSubmit || !data?.onSubmit) return
    data.onSubmit(id, promptText.trim())
    setPromptText("")
  }

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          stroke: isDraft
            ? "hsl(var(--border))"
            : "hsl(var(--foreground) / 0.3)",
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
              <span className="text-[10px] text-muted-foreground italic line-clamp-2 max-w-[120px]">
                {data.prompt}
              </span>
            </div>
          )}

          {data?.status === "done" && data.prompt && (
            <div className="bg-muted/70 rounded-lg px-2.5 py-1 max-w-[140px]">
              <p className="text-[10px] text-muted-foreground italic line-clamp-2 leading-relaxed">
                {data.prompt}
              </p>
            </div>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  )
})
