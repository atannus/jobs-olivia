"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Send, Loader2, Wand2 } from "lucide-react"
import type { ChatMessage } from "@/lib/types"

interface ConversationPanelProps {
  messages: ChatMessage[]
  onSend: (message: string) => void
  loading: boolean
  disabled?: boolean
}

export function ConversationPanel({
  messages,
  onSend,
  loading,
  disabled,
}: ConversationPanelProps) {
  const [input, setInput] = useState("")
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  function handleSend() {
    const text = input.trim()
    if (!text || loading) return
    onSend(text)
    setInput("")
  }

  return (
    <div className="flex flex-col gap-3 h-full">
      <div className="flex-1 overflow-y-auto space-y-3 pr-1" style={{ maxHeight: 280 }}>
        {messages.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-4">
            After generating, chat here to refine the image.
            <br />
            Try "make the background warmer" or "add a headline".
          </p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] rounded-xl px-3 py-2 text-sm leading-snug
                ${m.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-foreground"
                }`}
            >
              {m.triggeredGeneration && (
                <div className="flex items-center gap-1 mb-1">
                  <Wand2 className="w-3 h-3" />
                  <span className="text-[10px] opacity-70">Generating new image…</span>
                </div>
              )}
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-xl px-3 py-2">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="flex gap-2">
        <Textarea
          rows={2}
          placeholder="Make it warmer, add a headline…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={disabled || loading}
          className="resize-none text-sm flex-1"
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
          disabled={disabled || loading || !input.trim()}
          className="shrink-0 self-end"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </Button>
      </div>
    </div>
  )
}
