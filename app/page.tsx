"use client"

import { useState, useCallback, useRef } from "react"
import { useNodesState, useEdgesState } from "@xyflow/react"
import { RefreshCw } from "lucide-react"
import { Canvas } from "@/components/Canvas"
import { computeChildPosition } from "@/lib/layout"
import type { ImageNode, ImageEdge, NodeStatus, ProductAnalysis } from "@/lib/types"

const SOURCE_NODE_ID = "source"
let nodeCounter = 0

export default function Home() {
  // Stable wrappers that always delegate to the latest function implementations.
  // React Flow memoizes nodes, so the function references injected into node.data
  // must be stable — these wrappers satisfy that while always calling the current impl.
  const callbacksRef = useRef<{
    generateFromNode: (id: string, prompt: string) => void
    handleImageReady: (b64: string, mime: string) => void
  }>({ generateFromNode: () => {}, handleImageReady: () => {} })

  const stableOnGenerate = useRef((id: string, p: string) =>
    callbacksRef.current.generateFromNode(id, p)
  )
  const stableOnImageReady = useRef((b64: string, mime: string) =>
    callbacksRef.current.handleImageReady(b64, mime)
  )

  const [nodes, setNodes, onNodesChange] = useNodesState<ImageNode>([{
    id: SOURCE_NODE_ID,
    type: "imageNode",
    position: { x: 0, y: 0 },
    data: {
      status: "upload",
      isSource: true,
      onGenerate: stableOnGenerate.current,
      onImageReady: stableOnImageReady.current,
    },
  }])
  const [edges, setEdges, onEdgesChange] = useEdgesState<ImageEdge>([])
  const [sourceImageB64, setSourceImageB64] = useState<string | null>(null)
  const [sourceMime, setSourceMime] = useState("image/jpeg")

  // Refs for reading current values inside async callbacks (avoids stale closures)
  const nodesRef = useRef<ImageNode[]>([])
  const edgesRef = useRef<ImageEdge[]>([])
  const sourceB64Ref = useRef<string | null>(null)
  const sourceMimeRef = useRef("image/jpeg")

  nodesRef.current = nodes
  edgesRef.current = edges
  sourceB64Ref.current = sourceImageB64
  sourceMimeRef.current = sourceMime

  const handleImageReady = useCallback(async (b64: string, mimeType: string) => {
    setSourceImageB64(b64)
    setSourceMime(mimeType)
    setNodes((prev) =>
      prev.map((n) =>
        n.id === SOURCE_NODE_ID
          ? { ...n, data: { ...n.data, status: "ready" as NodeStatus, imageB64: b64, mimeType } }
          : n
      )
    )

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageB64: b64 }),
      })
      const data = await res.json()
      if (res.ok) {
        const analysis = data as ProductAnalysis
        setNodes((prev) =>
          prev.map((n) =>
            n.id === SOURCE_NODE_ID
              ? {
                  ...n,
                  data: {
                    ...n.data,
                    suggestedPrompts: analysis.suggestedPrompts,
                    productType: analysis.productType,
                  },
                }
              : n
          )
        )
      }
    } catch {
      // non-fatal — user can still type prompts
    }
  }, [setNodes])

  const generateFromNode = useCallback(async (sourceNodeId: string, prompt: string) => {
    const b64 = sourceB64Ref.current
    const mime = sourceMimeRef.current
    if (!b64) return

    const parentNode = nodesRef.current.find((n) => n.id === sourceNodeId)
    if (!parentNode) return

    const siblingCount = edgesRef.current.filter((e) => e.source === sourceNodeId).length
    const position = computeChildPosition(parentNode.position, siblingCount)

    const newNodeId = `node-${++nodeCounter}`
    const edgeId = `edge-${sourceNodeId}-${newNodeId}`

    setNodes((prev) => [
      ...prev,
      {
        id: newNodeId,
        type: "imageNode",
        position,
        zIndex: 1,
        data: {
          status: "loading" as NodeStatus,
          isSource: false,
          prompt,
          onGenerate: stableOnGenerate.current,
          onImageReady: stableOnImageReady.current,
        },
      },
    ])

    setEdges((prev) => [
      ...prev,
      {
        id: edgeId,
        source: sourceNodeId,
        target: newNodeId,
        animated: true,
        style: { strokeWidth: 2 },
      },
    ])

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageB64: b64, prompt, mimeType: mime }),
      })
      const data = await res.json()
      if (!res.ok || !data.imageB64) throw new Error(data.error ?? "Generation failed")

      setNodes((prev) =>
        prev.map((n) =>
          n.id === newNodeId
            ? {
                ...n,
                data: {
                  ...n.data,
                  status: "done" as NodeStatus,
                  imageB64: data.imageB64,
                  mimeType: "image/png",
                  improvedPrompt: data.improvedPrompt,
                },
              }
            : n
        )
      )
      setEdges((prev) =>
        prev.map((e) => (e.id === edgeId ? { ...e, animated: false } : e))
      )
    } catch (err) {
      setNodes((prev) =>
        prev.map((n) =>
          n.id === newNodeId
            ? {
                ...n,
                data: {
                  ...n.data,
                  status: "error" as NodeStatus,
                  errorMessage: err instanceof Error ? err.message : "Generation failed",
                },
              }
            : n
        )
      )
    }
  }, [setNodes, setEdges])

  // Keep callbacksRef in sync with latest implementations
  callbacksRef.current.generateFromNode = generateFromNode
  callbacksRef.current.handleImageReady = handleImageReady

  const reset = useCallback(() => {
    setSourceImageB64(null)
    setSourceMime("image/jpeg")
    nodeCounter = 0
    setNodes([{
      id: SOURCE_NODE_ID,
      type: "imageNode",
      position: { x: 0, y: 0 },
      data: {
        status: "upload",
        isSource: true,
        onGenerate: stableOnGenerate.current,
        onImageReady: stableOnImageReady.current,
      },
    }])
    setEdges([])
  }, [setNodes, setEdges])

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <header className="flex-none h-12 border-b flex items-center justify-between px-5 bg-background z-10">
        <span className="text-sm font-semibold tracking-tight">The Olivia</span>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">by Andre Tannus</span>
          {sourceImageB64 && (
            <button
              onClick={reset}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              New session
            </button>
          )}
        </div>
      </header>

      <div className="flex-1 overflow-hidden">
        <Canvas
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
        />
      </div>
    </div>
  )
}
