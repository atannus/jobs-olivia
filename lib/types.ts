export interface ProductAnalysis {
  productType: string
  style: string
  colors: string[]
  suggestedPrompts: string[]
}

export interface GenerationResult {
  imageB64: string
  originalPrompt: string
  improvedPrompt: string
}

export interface ChatMessage {
  role: "user" | "assistant"
  content: string
  imageB64?: string
  triggeredGeneration?: boolean
}

export interface ChatResponse {
  message: string
  shouldGenerate: boolean
  generationPrompt?: string
}
