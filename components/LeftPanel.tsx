"use client"

import { useRef, useEffect, useState } from "react"
import { Send, Loader2, Wand2, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { ImageUpload } from "@/components/ImageUpload"
import type { ChatMessage, ProductAnalysis } from "@/lib/types"

interface LeftPanelProps {
  referenceImageB64: string | null
  referenceMime: string
  analysis: ProductAnalysis | null
  analyzing: boolean
  messages: ChatMessage[]
  chatLoading: boolean
  generating: boolean
  error: string | null
  onImageReady: (b64: string, mimeType: string) => void
  onSend: (text: string) => void
  onReset: () => void
}

export function LeftPanel({
  referenceImageB64,
  referenceMime,
  analysis,
  analyzing,
  messages,
  chatLoading,
  generating,
  error,
  onImageReady,
  onSend,
  onReset,
}: LeftPanelProps) {
  const [input, setInput] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const busy = chatLoading || generating

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  function handleSend() {
    const text = input.trim()
    if (!text || busy) return
    onSend(text)
    setInput("")
  }

  return (
    <div className="w-80 flex-none h-full flex flex-col border-r bg-background">
      {/* Reference image — fixed, never scrolls */}
      <div className="flex-none border-b">
        {referenceImageB64 ? (
          <div className="relative">
            <img
              src={`data:${referenceMime};base64,${referenceImageB64}`}
              alt="Reference product"
              className="w-full object-contain bg-muted"
              style={{ maxHeight: 220 }}
              draggable={false}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent pointer-events-none" />
            <div className="absolute bottom-2 left-3 flex items-center gap-2">
              <span className="text-[10px] text-white/80 font-medium uppercase tracking-wider">
                Reference
              </span>
              {analysis && (
                <span className="text-[10px] text-white/70">
                  · {analysis.productType}
                </span>
              )}
            </div>
            <button
              onClick={onReset}
              title="Change image"
              className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/50 hover:bg-black/70 transition-colors"
            >
              <RefreshCw className="w-3 h-3 text-white" />
            </button>
            {analyzing && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                <Loader2 className="w-5 h-5 animate-spin text-white" />
              </div>
            )}
          </div>
        ) : (
          <div className="p-4">
            <ImageUpload onImageReady={onImageReady} disabled={analyzing} />
          </div>
        )}
      </div>

      {/* Conversation — scrollable */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.length === 0 && !referenceImageB64 && (
          <p className="text-xs text-muted-foreground text-center pt-4 leading-relaxed">
            Upload a product image above to get started.
          </p>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed
                ${m.role === "user"
                  ? "bg-foreground text-background rounded-br-sm"
                  : "bg-muted text-foreground rounded-bl-sm"
                }`}
            >
              {m.triggeredGeneration && (
                <div className="flex items-center gap-1 mb-1 opacity-60">
                  <Wand2 className="w-3 h-3" />
                  <span className="text-[9px] uppercase tracking-wider">Generating</span>
                </div>
              )}
              {m.content}
            </div>
          </div>
        ))}

        {(chatLoading || generating) && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-2xl rounded-bl-sm px-3 py-2">
              <div className="flex gap-1 items-center h-4">
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}

        {/* Suggested prompts — shown only after analysis, before first generation */}
        {analysis && messages.filter(m => m.role === "user").length === 0 && (
          <div className="space-y-1.5 pt-1">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide px-1">
              Try a scene
            </p>
            {analysis.suggestedPrompts.map((p, i) => (
              <button
                key={i}
                onClick={() => onSend(p)}
                disabled={busy}
                className="w-full text-left text-xs px-3 py-2 rounded-xl bg-muted hover:bg-muted-foreground/15 transition-colors leading-snug disabled:opacity-40"
              >
                {p}
              </button>
            ))}
          </div>
        )}

        {error && (
          <p className="text-xs text-destructive bg-destructive/10 rounded-xl px-3 py-2">
            {error}
          </p>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input — fixed at bottom */}
      {referenceImageB64 && (
        <div className="flex-none border-t p-3 flex gap-2">
          <Textarea
            rows={2}
            placeholder="Describe the ad scene…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={busy || !referenceImageB64}
            className="resize-none text-sm flex-1 min-h-0"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={busy || !input.trim() || !referenceImageB64}
            className="shrink-0 self-end"
          >
            {busy ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      )}
    </div>
  )
}
