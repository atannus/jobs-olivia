export interface ProductAnalysis {
  productType: string
  style: string
  colors: string[]
  suggestedPrompts: string[]
}

export interface IterationStep {
  id: string
  imageB64: string
  mimeType: string
  isOriginal: boolean
  prompt?: string
  improvedPrompt?: string
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
