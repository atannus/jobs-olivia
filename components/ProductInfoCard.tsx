"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Sparkles } from "lucide-react"
import type { ProductAnalysis } from "@/lib/types"

interface ProductInfoCardProps {
  analysis: ProductAnalysis
  onSelectPrompt: (prompt: string) => void
}

export function ProductInfoCard({ analysis, onSelectPrompt }: ProductInfoCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <span>{analysis.productType}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-1.5">
          {analysis.colors.map((color) => (
            <Badge key={color} variant="secondary" className="text-xs">
              {color}
            </Badge>
          ))}
          <Badge variant="outline" className="text-xs">
            {analysis.style}
          </Badge>
        </div>

        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Suggested scenes
          </p>
          {analysis.suggestedPrompts.map((p, i) => (
            <button
              key={i}
              onClick={() => onSelectPrompt(p)}
              className="w-full text-left text-xs p-2.5 rounded-lg bg-muted hover:bg-primary/10 hover:text-primary transition-colors border border-transparent hover:border-primary/20"
            >
              {p}
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
