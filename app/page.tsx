"use client"

import { useState, useCallback, useRef } from "react"
import { useNodesState, useEdgesState, MarkerType } from "@xyflow/react"
import { RefreshCw, FlaskConical } from "lucide-react"
import { Canvas } from "@/components/Canvas"
import { getChildX, getBalancedYPositions } from "@/lib/layout"
import type { ImageNode, PromptEdge, NodeStatus, ProductAnalysis } from "@/lib/types"

const SOURCE_NODE_ID = "source"
let nodeCounter = 0

const DEFAULT_MARKER = { type: MarkerType.ArrowClosed, width: 12, height: 12 }

function noopImageReady() {}

export default function Home() {
  // callbacksRef + stable wrappers: node/edge data needs stable function refs
  // so React Flow doesn't remount nodes on every render. The wrappers always
  // delegate to the latest implementation stored in callbacksRef.
  const callbacksRef = useRef<{
    handleImageReady: (b64: string, mime: string) => void
    onEdgeSubmit: (edgeId: string, prompt: string) => void
  }>({ handleImageReady: () => {}, onEdgeSubmit: () => {} })

  const stableOnImageReady = useRef((b64: string, mime: string) =>
    callbacksRef.current.handleImageReady(b64, mime)
  )
  const stableOnEdgeSubmit = useRef((edgeId: string, prompt: string) =>
    callbacksRef.current.onEdgeSubmit(edgeId, prompt)
  )

  const [nodes, setNodes, onNodesChange] = useNodesState<ImageNode>([{
    id: SOURCE_NODE_ID,
    type: "imageNode",
    position: { x: 0, y: 0 },
    data: { status: "upload", isSource: true, onImageReady: stableOnImageReady.current },
  }])
  const [edges, setEdges, onEdgesChange] = useEdgesState<PromptEdge>([])
  const [sourceImageB64, setSourceImageB64] = useState<string | null>(null)
  const [sourceMime, setSourceMime] = useState("image/jpeg")
  const [testMode, setTestMode] = useState(true)

  // Mutable refs for reading current values inside async callbacks (avoids stale closures)
  const nodesRef = useRef<ImageNode[]>([])
  const edgesRef = useRef<PromptEdge[]>([])
  const sourceB64Ref = useRef<string | null>(null)
  const sourceMimeRef = useRef("image/jpeg")
  const testModeRef = useRef(false)

  nodesRef.current = nodes
  edgesRef.current = edges
  sourceB64Ref.current = sourceImageB64
  sourceMimeRef.current = sourceMime
  testModeRef.current = testMode

  const handleImageReady = useCallback(async (b64: string, mimeType: string) => {
    setSourceImageB64(b64)
    setSourceMime(mimeType)

    const placeholderId = `node-${++nodeCounter}`
    const edgeId = `edge-${SOURCE_NODE_ID}-${placeholderId}`

    setNodes((prev) => [
      ...prev.map((n) =>
        n.id === SOURCE_NODE_ID
          ? { ...n, data: { ...n.data, status: "ready" as NodeStatus, imageB64: b64, mimeType } }
          : n
      ),
      {
        id: placeholderId,
        type: "imageNode" as const,
        position: { x: getChildX(0), y: 0 },
        data: { status: "placeholder" as NodeStatus, isSource: false, onImageReady: noopImageReady },
      },
    ])

    setEdges((prev) => [
      ...prev,
      {
        id: edgeId,
        type: "promptEdge" as const,
        source: SOURCE_NODE_ID,
        target: placeholderId,
        markerEnd: DEFAULT_MARKER,
        data: { status: "draft" as const, onSubmit: stableOnEdgeSubmit.current },
      },
    ])

    if (testModeRef.current) return

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageB64: b64 }),
      })
      const data = await res.json()
      if (res.ok) {
        setNodes((prev) =>
          prev.map((n) =>
            n.id === SOURCE_NODE_ID
              ? { ...n, data: { ...n.data, productType: (data as ProductAnalysis).productType } }
              : n
          )
        )
      }
    } catch {
      // non-fatal
    }
  }, [setNodes, setEdges])

  const onEdgeSubmit = useCallback(async (edgeId: string, prompt: string) => {
    const b64 = sourceB64Ref.current
    const mime = sourceMimeRef.current
    if (!b64) return

    const edge = edgesRef.current.find((e) => e.id === edgeId)
    if (!edge) return

    const { source: sourceNodeId, target: targetNodeId } = edge
    const sourceNode = nodesRef.current.find((n) => n.id === sourceNodeId)
    if (!sourceNode) return

    // All existing edges from this source (includes the one being submitted)
    const siblingEdges = edgesRef.current.filter((e) => e.source === sourceNodeId)
    const siblingTargetIds = siblingEdges.map((e) => e.target)

    // New placeholder for the next branch from the same source
    const newPlaceholderId = `node-${++nodeCounter}`
    const newEdgeId = `edge-${sourceNodeId}-${newPlaceholderId}`

    // Rebalance: N existing children + 1 new = N+1 total
    const totalChildren = siblingTargetIds.length + 1
    const balancedYs = getBalancedYPositions(sourceNode.position.y, totalChildren)
    const childX = getChildX(sourceNode.position.x)

    setNodes((prev) => [
      ...prev.map((n) => {
        const idx = siblingTargetIds.indexOf(n.id)
        if (idx === -1) return n
        const newY = balancedYs[idx]
        if (n.id === targetNodeId) {
          return { ...n, position: { ...n.position, y: newY }, data: { ...n.data, status: "loading" as NodeStatus } }
        }
        return { ...n, position: { ...n.position, y: newY } }
      }),
      {
        id: newPlaceholderId,
        type: "imageNode" as const,
        position: { x: childX, y: balancedYs[totalChildren - 1] },
        data: { status: "placeholder" as NodeStatus, isSource: false, onImageReady: noopImageReady },
      },
    ])

    setEdges((prev) => [
      ...prev.map((e) =>
        e.id === edgeId
          ? { ...e, animated: true, data: { ...e.data!, status: "generating" as const, prompt } }
          : e
      ),
      {
        id: newEdgeId,
        type: "promptEdge" as const,
        source: sourceNodeId,
        target: newPlaceholderId,
        markerEnd: DEFAULT_MARKER,
        data: { status: "draft" as const, onSubmit: stableOnEdgeSubmit.current },
      },
    ])

    // --- API call ---
    try {
      let generatedB64: string
      let improvedPrompt: string

      if (testModeRef.current) {
        await new Promise<void>((resolve) => setTimeout(resolve, 2000))
        generatedB64 = b64
        improvedPrompt = prompt
      } else {
        const res = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageB64: b64, prompt, mimeType: mime }),
        })
        const data = await res.json()
        if (!res.ok || !data.imageB64) throw new Error(data.error ?? "Generation failed")
        generatedB64 = data.imageB64
        improvedPrompt = data.improvedPrompt
      }

      // Position of the now-done target (may have shifted during rebalance)
      const targetCurrentY =
        nodesRef.current.find((n) => n.id === targetNodeId)?.position.y ?? 0

      // New placeholder to the right of the done node (for branching from it)
      const nextPlaceholderId = `node-${++nodeCounter}`
      const nextEdgeId = `edge-${targetNodeId}-${nextPlaceholderId}`

      setNodes((prev) => [
        ...prev.map((n) =>
          n.id === targetNodeId
            ? {
                ...n,
                data: {
                  ...n.data,
                  status: "done" as NodeStatus,
                  imageB64: generatedB64,
                  mimeType: "image/png",
                  improvedPrompt,
                },
              }
            : n
        ),
        {
          id: nextPlaceholderId,
          type: "imageNode" as const,
          position: { x: getChildX(childX), y: targetCurrentY },
          data: { status: "placeholder" as NodeStatus, isSource: false, onImageReady: noopImageReady },
        },
      ])

      setEdges((prev) => [
        ...prev.map((e) =>
          e.id === edgeId
            ? { ...e, animated: false, data: { ...e.data!, status: "done" as const } }
            : e
        ),
        {
          id: nextEdgeId,
          type: "promptEdge" as const,
          source: targetNodeId,
          target: nextPlaceholderId,
          markerEnd: DEFAULT_MARKER,
          data: { status: "draft" as const, onSubmit: stableOnEdgeSubmit.current },
        },
      ])
    } catch (err) {
      setNodes((prev) =>
        prev.map((n) =>
          n.id === targetNodeId
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
      setEdges((prev) =>
        prev.map((e) =>
          e.id === edgeId
            ? { ...e, animated: false, data: { ...e.data!, status: "done" as const } }
            : e
        )
      )
    }
  }, [setNodes, setEdges])

  // Keep callbacksRef current every render
  callbacksRef.current.handleImageReady = handleImageReady
  callbacksRef.current.onEdgeSubmit = onEdgeSubmit

  const reset = useCallback(() => {
    setSourceImageB64(null)
    setSourceMime("image/jpeg")
    nodeCounter = 0
    setNodes([{
      id: SOURCE_NODE_ID,
      type: "imageNode",
      position: { x: 0, y: 0 },
      data: { status: "upload", isSource: true, onImageReady: stableOnImageReady.current },
    }])
    setEdges([])
  }, [setNodes, setEdges])

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <header className="flex-none h-12 border-b flex items-center justify-between px-5 bg-background z-10">
        <span className="text-sm font-semibold tracking-tight">The Olivia</span>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setTestMode((t) => !t)}
            className={`text-xs flex items-center gap-1.5 px-2 py-1 rounded-md transition-colors ${
              testMode
                ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <FlaskConical className="w-3 h-3" />
            Test
          </button>
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
