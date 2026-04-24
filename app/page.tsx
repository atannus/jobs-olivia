"use client"

import { useState, useCallback } from "react"
import { LeftPanel } from "@/components/LeftPanel"
import { ImageTimeline } from "@/components/ImageTimeline"
import type { ProductAnalysis, ChatMessage, IterationStep } from "@/lib/types"

let stepCounter = 0
function nextId() {
  return `step-${++stepCounter}`
}

export default function Home() {
  const [referenceB64, setReferenceB64] = useState<string | null>(null)
  const [referenceMime, setReferenceMime] = useState("image/jpeg")
  const [analysis, setAnalysis] = useState<ProductAnalysis | null>(null)
  const [analyzing, setAnalyzing] = useState(false)

  const [steps, setSteps] = useState<IterationStep[]>([])
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [chatLoading, setChatLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [pendingPrompt, setPendingPrompt] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const reset = useCallback(() => {
    setReferenceB64(null)
    setAnalysis(null)
    setSteps([])
    setMessages([])
    setError(null)
    setPendingPrompt(null)
  }, [])

  const handleImageReady = useCallback(async (b64: string, mimeType: string) => {
    setReferenceB64(b64)
    setReferenceMime(mimeType)
    setAnalysis(null)
    setSteps([{
      id: nextId(),
      imageB64: b64,
      mimeType,
      isOriginal: true,
    }])
    setMessages([])
    setError(null)
    setAnalyzing(true)

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageB64: b64 }),
      })
      const data = await res.json()
      if (res.ok) {
        setAnalysis(data as ProductAnalysis)
        setMessages([{
          role: "assistant",
          content: `I see a ${data.productType} with a ${data.style} feel. What scene would you like to create?`,
        }])
      }
    } catch {
      // non-fatal, user can still type
    } finally {
      setAnalyzing(false)
    }
  }, [])

  const generate = useCallback(async (prompt: string, context: ChatMessage[]) => {
    if (!referenceB64) return
    setGenerating(true)
    setPendingPrompt(prompt)
    setError(null)

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageB64: referenceB64, prompt, mimeType: referenceMime }),
      })
      const data = await res.json()
      if (!res.ok || !data.imageB64) throw new Error(data.error ?? "Generation failed")

      const newStep: IterationStep = {
        id: nextId(),
        imageB64: data.imageB64,
        mimeType: "image/png",
        isOriginal: false,
        prompt,
        improvedPrompt: data.improvedPrompt,
      }
      setSteps((prev) => [...prev, newStep])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed")
    } finally {
      setGenerating(false)
      setPendingPrompt(null)
    }
  }, [referenceB64, referenceMime])

  const handleSend = useCallback(async (userText: string) => {
    const userMsg: ChatMessage = { role: "user", content: userText }
    const updatedMessages = [...messages, userMsg]
    setMessages(updatedMessages)
    setChatLoading(true)

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages,
          productType: analysis?.productType ?? "product",
          userMessage: userText,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Chat failed")

      const assistantMsg: ChatMessage = {
        role: "assistant",
        content: data.message,
        triggeredGeneration: data.shouldGenerate,
      }
      setMessages((prev) => [...prev, assistantMsg])
      setChatLoading(false)

      if (data.shouldGenerate && data.generationPrompt) {
        await generate(data.generationPrompt, [...updatedMessages, assistantMsg])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
      setChatLoading(false)
    }
  }, [messages, analysis, generate])

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Header */}
      <header className="flex-none h-12 border-b flex items-center justify-between px-5">
        <span className="text-sm font-semibold tracking-tight">The Olivia</span>
        <span className="text-xs text-muted-foreground">by Andre Tannus</span>
      </header>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden">
        <LeftPanel
          referenceImageB64={referenceB64}
          referenceMime={referenceMime}
          analysis={analysis}
          analyzing={analyzing}
          messages={messages}
          chatLoading={chatLoading}
          generating={generating}
          error={error}
          onImageReady={handleImageReady}
          onSend={handleSend}
          onReset={reset}
        />

        <div className="flex-1 overflow-hidden bg-muted/30">
          <ImageTimeline
            steps={steps}
            generating={generating}
            pendingPrompt={pendingPrompt}
          />
        </div>
      </div>
    </div>
  )
}
