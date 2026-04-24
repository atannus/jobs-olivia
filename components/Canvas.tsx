"use client"

import { useEffect } from "react"
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  Controls,
  useReactFlow,
  type OnNodesChange,
  type OnEdgesChange,
} from "@xyflow/react"
import { ImageNodeCard } from "@/components/ImageNodeCard"
import { PromptEdgeComponent } from "@/components/PromptEdge"
import type { ImageNode, PromptEdge } from "@/lib/types"

// Defined outside component — React Flow will infinite-loop if these are recreated each render.
const nodeTypes = { imageNode: ImageNodeCard }
const edgeTypes = { promptEdge: PromptEdgeComponent }

interface CanvasProps {
  nodes: ImageNode[]
  edges: PromptEdge[]
  onNodesChange: OnNodesChange<ImageNode>
  onEdgesChange: OnEdgesChange<PromptEdge>
}

function CanvasInner({ nodes, edges, onNodesChange, onEdgesChange }: CanvasProps) {
  const { setViewport } = useReactFlow()

  useEffect(() => {
    const HEADER_H = 48
    // Source node (300px wide) centered in the left third of the viewport
    const panX = window.innerWidth / 6 - 150
    const panY = (window.innerHeight - HEADER_H) / 2 - 150
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
