"use client"

import { useState, useCallback } from "react"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { ImageUpload } from "@/components/ImageUpload"
import { ProductInfoCard } from "@/components/ProductInfoCard"
import { PromptInput } from "@/components/PromptInput"
import { ResultViewer } from "@/components/ResultViewer"
import { ConversationPanel } from "@/components/ConversationPanel"
import { Loader2, Sparkles } from "lucide-react"
import type { ProductAnalysis, ChatMessage, GenerationResult } from "@/lib/types"

export default function Home() {
  const [imageB64, setImageB64] = useState<string | null>(null)
  const [imageMime, setImageMime] = useState<string>("image/jpeg")
  const [analyzing, setAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<ProductAnalysis | null>(null)

  const [prompt, setPrompt] = useState("")
  const [generating, setGenerating] = useState(false)
  const [result, setResult] = useState<GenerationResult | null>(null)

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatLoading, setChatLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [analyzeError, setAnalyzeError] = useState<string | null>(null)

  const handleImageReady = useCallback(async (b64: string, mimeType: string) => {
    setImageB64(b64)
    setImageMime(mimeType)
    setAnalysis(null)
    setResult(null)
    setChatMessages([])
    setAnalyzeError(null)
    setAnalyzing(true)
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageB64: b64 }),
      })
      const data = await res.json()
      if (!res.ok) {
        setAnalyzeError(data.error ?? "Analysis failed")
      } else {
        setAnalysis(data as ProductAnalysis)
      }
    } catch (err) {
      setAnalyzeError(err instanceof Error ? err.message : "Analysis failed")
    } finally {
      setAnalyzing(false)
    }
  }, [])

  const handleGenerate = useCallback(async (promptOverride?: string) => {
    const p = promptOverride ?? prompt
    if (!imageB64 || !p.trim()) return
    setGenerating(true)
    setError(null)
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageB64, prompt: p, mimeType: imageMime }),
      })
      if (!res.ok) throw new Error(`Generation failed (${res.status})`)
      const data: GenerationResult = await res.json()
      if (!data.imageB64) throw new Error("No image returned")
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setGenerating(false)
    }
  }, [imageB64, imageMime, prompt])

  const handleChat = useCallback(async (userMessage: string) => {
    const newMessages: ChatMessage[] = [
      ...chatMessages,
      { role: "user", content: userMessage },
    ]
    setChatMessages(newMessages)
    setChatLoading(true)

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: chatMessages,
          currentImageB64: result?.imageB64 ?? null,
          userMessage,
        }),
      })
      const data = await res.json()

      const assistantMsg: ChatMessage = {
        role: "assistant",
        content: data.message,
        triggeredGeneration: data.shouldGenerate,
      }
      setChatMessages([...newMessages, assistantMsg])

      if (data.shouldGenerate && data.generationPrompt) {
        setPrompt(data.generationPrompt)
        await handleGenerate(data.generationPrompt)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setChatLoading(false)
    }
  }, [chatMessages, result, handleGenerate])

  const hasImage = !!imageB64

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-semibold text-sm tracking-tight">AdGen</span>
        </div>
        <Badge variant="outline" className="text-[10px]">
          Powered by GPT-4o + gpt-image-1
        </Badge>
      </header>

      <main className="flex-1 grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-0 overflow-hidden">
        {/* Left panel */}
        <div className="border-r flex flex-col overflow-y-auto">
          <div className="p-5 space-y-4">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                1. Upload product
              </p>
              <ImageUpload onImageReady={handleImageReady} disabled={analyzing || generating} />
            </div>

            {analyzing && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                Analyzing product…
              </div>
            )}

            {analyzeError && !analyzing && (
              <p className="text-xs text-amber-600 bg-amber-50 rounded-lg p-2.5">
                Analysis failed: {analyzeError}. You can still type a prompt manually.
              </p>
            )}

            {analysis && (
              <ProductInfoCard
                analysis={analysis}
                onSelectPrompt={(p) => setPrompt(p)}
              />
            )}

            {hasImage && (
              <>
                <Separator />
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                    2. Describe the scene
                  </p>
                  <PromptInput
                    value={prompt}
                    onChange={setPrompt}
                    onGenerate={() => handleGenerate()}
                    improvedPrompt={result?.improvedPrompt}
                    loading={generating}
                    disabled={!hasImage}
                  />
                  {error && (
                    <p className="text-xs text-destructive mt-2 bg-destructive/10 rounded-lg p-2.5">
                      {error}
                    </p>
                  )}
                </div>
              </>
            )}
          </div>

          {result && (
            <>
              <Separator />
              <div className="p-5 flex-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
                  3. Iterate
                </p>
                <ConversationPanel
                  messages={chatMessages}
                  onSend={handleChat}
                  loading={chatLoading || generating}
                  disabled={!result}
                />
              </div>
            </>
          )}
        </div>

        {/* Right panel */}
        <div className="p-6 flex flex-col">
          <ResultViewer
            originalB64={imageB64}
            resultB64={result?.imageB64 ?? null}
            loading={generating}
          />
        </div>
      </main>
    </div>
  )
}
