import type { Node, Edge } from "@xyflow/react"

export interface ProductAnalysis {
  productType: string
  style: string
  colors: string[]
  suggestedPrompts: string[]
}

export interface ChatMessage {
  role: "user" | "assistant"
  content: string
  triggeredGeneration?: boolean
}

export interface ChatResponse {
  message: string
  shouldGenerate: boolean
  generationPrompt?: string
}

export type NodeStatus = "upload" | "ready" | "loading" | "done" | "error"

export interface ImageNodeData extends Record<string, unknown> {
  status: NodeStatus
  imageB64?: string
  mimeType?: string
  isSource: boolean
  prompt?: string
  improvedPrompt?: string
  errorMessage?: string
  suggestedPrompts?: string[]
  productType?: string
  onGenerate: (sourceNodeId: string, prompt: string) => void
  onImageReady: (b64: string, mimeType: string) => void
}

export type ImageNode = Node<ImageNodeData>
export type ImageEdge = Edge
