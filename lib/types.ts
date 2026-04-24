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

export type NodeStatus = "upload" | "placeholder" | "ready" | "loading" | "done" | "error"

export interface ImageNodeData extends Record<string, unknown> {
  status: NodeStatus
  imageB64?: string
  mimeType?: string
  isSource: boolean
  improvedPrompt?: string
  errorMessage?: string
  productType?: string
  onImageReady: (b64: string, mimeType: string) => void
}

export type ImageNode = Node<ImageNodeData>

export interface PromptEdgeData extends Record<string, unknown> {
  status: "draft" | "generating" | "done"
  prompt?: string
  childId: string
  onSubmit: (childId: string, prompt: string) => void
  onInteract?: () => void
  getDraftText?: () => string
  setDraftText?: (text: string) => void
}

export type PromptEdge = Edge<PromptEdgeData>

export interface TreeEdge {
  id: string
  status: "draft" | "generating" | "done"
  prompt?: string
}

export interface TreeNode {
  id: string
  status: NodeStatus
  imageB64?: string
  mimeType?: string
  isSource: boolean
  improvedPrompt?: string
  errorMessage?: string
  productType?: string
  children: Array<{ edge: TreeEdge; node: TreeNode }>
}
