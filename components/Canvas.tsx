"use client"

import { useEffect } from "react"
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  Controls,
  useReactFlow,
} from "@xyflow/react"
import { ImageNodeCard } from "@/components/ImageNodeCard"
import { NODE_WIDTH, NODE_HEIGHT } from "@/lib/layout"
import { PromptEdgeComponent } from "@/components/PromptEdge"
import type { ImageNode, PromptEdge } from "@/lib/types"

// Defined outside component — React Flow will infinite-loop if these are recreated each render.
const nodeTypes = { imageNode: ImageNodeCard }
const edgeTypes = { promptEdge: PromptEdgeComponent }

interface CanvasProps {
  nodes: ImageNode[]
  edges: PromptEdge[]
  onNodesChange: () => void
  onEdgesChange: () => void
}

function CanvasInner({ nodes, edges, onNodesChange, onEdgesChange }: CanvasProps) {
  const { setViewport } = useReactFlow()

  useEffect(() => {
    const HEADER_H = 48
    const panX = window.innerWidth / 6 - NODE_WIDTH / 2
    const panY = (window.innerHeight - HEADER_H) / 2 - NODE_HEIGHT / 2
    setViewport({ x: panX, y: panY, zoom: 1 }, { duration: 0 })
  }, [setViewport])

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      deleteKeyCode={null}
      nodesConnectable={false}
      nodesDraggable={false}
      fitView={false}
      minZoom={0.15}
      maxZoom={2}
      style={{ width: "100%", height: "100%" }}
      edgesFocusable={false}
    >
      <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
      <Controls position="bottom-right" showInteractive={false} />
    </ReactFlow>
  )
}

export function Canvas(props: CanvasProps) {
  return (
    <ReactFlowProvider>
      <CanvasInner {...props} />
    </ReactFlowProvider>
  )
}
