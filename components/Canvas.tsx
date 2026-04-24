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
import type { ImageNode, ImageEdge } from "@/lib/types"

// Must be defined outside the component to prevent React Flow from
// re-registering types on every render (which causes infinite loops).
const nodeTypes = { imageNode: ImageNodeCard }

interface CanvasProps {
  nodes: ImageNode[]
  edges: ImageEdge[]
  onNodesChange: OnNodesChange<ImageNode>
  onEdgesChange: OnEdgesChange
}

function CanvasInner({ nodes, edges, onNodesChange, onEdgesChange }: CanvasProps) {
  const { setViewport } = useReactFlow()

  useEffect(() => {
    const HEADER_H = 48
    // Center the source node vertically and place it in the left eighth of the canvas
    const panX = window.innerWidth / 8
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
      deleteKeyCode={null}
      nodesConnectable={false}
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
