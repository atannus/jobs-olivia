"use client"

import { useState, useCallback, useRef, useMemo } from "react"
import { RefreshCw, FlaskConical, Sparkles } from "lucide-react"
import { Canvas } from "@/components/Canvas"
import { treeToFlow, updateNode, updateEdge, addChild, findParent } from "@/lib/tree"
import type { TreeNode, ProductAnalysis } from "@/lib/types"

const SOURCE_NODE_ID = "source"
let nodeCounter = 0

const initialTree: TreeNode = {
  id: SOURCE_NODE_ID,
  status: "upload",
  isSource: true,
  children: [],
}

export default function Home() {
  const callbacksRef = useRef<{
    handleImageReady: (b64: string, mime: string) => void
    onEdgeSubmit: (childId: string, prompt: string) => void
  }>({ handleImageReady: () => {}, onEdgeSubmit: () => {} })

  const stableOnImageReady = useRef((b64: string, mime: string) =>
    callbacksRef.current.handleImageReady(b64, mime)
  )
  const stableOnSubmit = useRef((childId: string, prompt: string) =>
    callbacksRef.current.onEdgeSubmit(childId, prompt)
  )

  const [tree, setTree] = useState<TreeNode>(initialTree)
  const [testMode, setTestMode] = useState(true)
  const [quality, setQuality] = useState<"low" | "high">("high")

  const treeRef = useRef<TreeNode>(initialTree)
  const sourceB64Ref = useRef<string | null>(null)
  const sourceMimeRef = useRef("image/jpeg")
  const testModeRef = useRef(true)
  const qualityRef = useRef<"low" | "high">("high")

  treeRef.current = tree
  testModeRef.current = testMode
  qualityRef.current = quality

  const { nodes, edges } = useMemo(
    () => treeToFlow(tree, stableOnImageReady.current, stableOnSubmit.current),
    [tree]
  )

  const handleImageReady = useCallback(async (b64: string, mimeType: string) => {
    sourceB64Ref.current = b64
    sourceMimeRef.current = mimeType

    const placeholderId = `node-${++nodeCounter}`
    const edgeId = `edge-${SOURCE_NODE_ID}-${placeholderId}`

    setTree(prev => ({
      ...prev,
      status: "ready",
      imageB64: b64,
      mimeType,
      children: [
        ...prev.children,
        {
          edge: { id: edgeId, status: "draft" },
          node: { id: placeholderId, status: "placeholder", isSource: false, children: [] },
        },
      ],
    }))

    if (testModeRef.current) return

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageB64: b64 }),
      })
      const data = await res.json()
      if (res.ok) {
        setTree(prev =>
          updateNode(prev, SOURCE_NODE_ID, n => ({
            ...n,
            productType: (data as ProductAnalysis).productType,
          }))
        )
      }
    } catch {
      // non-fatal
    }
  }, [])

  const onEdgeSubmit = useCallback(async (childId: string, prompt: string) => {
    const parent = findParent(treeRef.current, childId)
    if (!parent) return

    // Use the parent node's own image so branching from a generated image
    // edits that image, not the original upload.
    const b64 = parent.imageB64 ?? sourceB64Ref.current
    const mime = parent.mimeType ?? sourceMimeRef.current
    if (!b64) return

    const newSiblingId = `node-${++nodeCounter}`
    const newSiblingEdgeId = `edge-${parent.id}-${newSiblingId}`

    setTree(prev => {
      let next = updateNode(prev, childId, n => ({ ...n, status: "loading" }))
      next = updateEdge(next, childId, e => ({ ...e, status: "generating", prompt }))
      next = addChild(
        next,
        parent.id,
        { id: newSiblingEdgeId, status: "draft" },
        { id: newSiblingId, status: "placeholder", isSource: false, children: [] }
      )
      return next
    })

    try {
      let generatedB64: string
      let improvedPrompt: string

      if (testModeRef.current) {
        await new Promise<void>(r => setTimeout(r, 2000))
        generatedB64 = b64
        improvedPrompt = prompt
      } else {
        const res = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageB64: b64, prompt, mimeType: mime, quality: qualityRef.current, isSourceEdit: parent.isSource }),
        })
        const data = await res.json()
        if (!res.ok || !data.imageB64) throw new Error(data.error ?? "Generation failed")
        generatedB64 = data.imageB64
        improvedPrompt = data.improvedPrompt
      }

      const nextPlaceholderId = `node-${++nodeCounter}`
      const nextEdgeId = `edge-${childId}-${nextPlaceholderId}`

      setTree(prev => {
        let next = updateNode(prev, childId, n => ({
          ...n,
          status: "done",
          imageB64: generatedB64,
          mimeType: "image/png",
          improvedPrompt,
        }))
        next = updateEdge(next, childId, e => ({ ...e, status: "done" }))
        next = addChild(
          next,
          childId,
          { id: nextEdgeId, status: "draft" },
          { id: nextPlaceholderId, status: "placeholder", isSource: false, children: [] }
        )
        return next
      })
    } catch (err) {
      setTree(prev => {
        let next = updateNode(prev, childId, n => ({
          ...n,
          status: "error",
          errorMessage: err instanceof Error ? err.message : "Generation failed",
        }))
        next = updateEdge(next, childId, e => ({ ...e, status: "done" }))
        return next
      })
    }
  }, [])

  callbacksRef.current.handleImageReady = handleImageReady
  callbacksRef.current.onEdgeSubmit = onEdgeSubmit

  const reset = useCallback(() => {
    sourceB64Ref.current = null
    sourceMimeRef.current = "image/jpeg"
    nodeCounter = 0
    setTree(initialTree)
  }, [])

  const hasImage = sourceB64Ref.current !== null || tree.status !== "upload"

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <header className="flex-none h-12 border-b flex items-center justify-between px-5 bg-background z-10">
        <span className="text-sm font-semibold tracking-tight">The Olivia</span>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setQuality(q => q === "low" ? "high" : "low")}
            className={`text-xs flex items-center gap-1.5 px-2 py-1 rounded-md transition-colors ${
              quality === "high"
                ? "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Sparkles className="w-3 h-3" />
            HD
          </button>
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
          {hasImage && (
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
          onNodesChange={() => {}}
          onEdgesChange={() => {}}
        />
      </div>
    </div>
  )
}
