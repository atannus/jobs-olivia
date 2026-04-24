"use client"

import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Wand2, Loader2 } from "lucide-react"

interface PromptInputProps {
  value: string
  onChange: (v: string) => void
  onGenerate: () => void
  improvedPrompt?: string
  loading: boolean
  disabled?: boolean
}

export function PromptInput({
  value,
  onChange,
  onGenerate,
  improvedPrompt,
  loading,
  disabled,
}: PromptInputProps) {
  return (
    <div className="space-y-2">
      <Textarea
        placeholder="Describe the ad scene… e.g. 'lifestyle photo on a marble countertop'"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled || loading}
        className="resize-none text-sm"
        rows={3}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) onGenerate()
        }}
      />

      {improvedPrompt && (
        <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/60 rounded-lg p-2.5">
          <Badge variant="secondary" className="shrink-0 text-[10px]">
            ✨ Improved
          </Badge>
          <span className="italic leading-snug">{improvedPrompt}</span>
        </div>
      )}

      <Button
        onClick={onGenerate}
        disabled={disabled || loading || !value.trim()}
        className="w-full gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Generating…
          </>
        ) : (
          <>
            <Wand2 className="w-4 h-4" />
            Generate Ad
          </>
        )}
      </Button>
      <p className="text-center text-[10px] text-muted-foreground">
        ⌘↵ to generate
      </p>
    </div>
  )
}
