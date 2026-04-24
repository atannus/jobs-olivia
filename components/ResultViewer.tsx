"use client"

import { useRef, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Download, Loader2, ImageIcon } from "lucide-react"

interface ResultViewerProps {
  originalB64: string | null
  resultB64: string | null
  loading: boolean
}

export function ResultViewer({ originalB64, resultB64, loading }: ResultViewerProps) {
  const [sliderX, setSliderX] = useState(50)
  const containerRef = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)

  const updateSlider = useCallback((clientX: number) => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    const pct = Math.min(100, Math.max(0, ((clientX - rect.left) / rect.width) * 100))
    setSliderX(pct)
  }, [])

  function handleDownload() {
    if (!resultB64) return
    const a = document.createElement("a")
    a.href = `data:image/png;base64,${resultB64}`
    a.download = "ad-generated.png"
    a.click()
  }

  const showSlider = !!(originalB64 && resultB64)

  return (
    <div className="flex flex-col gap-3 h-full">
      <div
        ref={containerRef}
        className="relative rounded-xl overflow-hidden bg-muted flex-1 select-none"
        style={{ minHeight: 320, cursor: showSlider ? "col-resize" : "default" }}
        onMouseMove={(e) => { if (dragging.current) updateSlider(e.clientX) }}
        onMouseUp={() => { dragging.current = false }}
        onMouseLeave={() => { dragging.current = false }}
        onTouchMove={(e) => updateSlider(e.touches[0].clientX)}
        onTouchEnd={() => { dragging.current = false }}
      >
        {loading && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-background/80 backdrop-blur-sm">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Generating your ad…</p>
          </div>
        )}

        {!originalB64 && !resultB64 && !loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-muted-foreground">
            <div className="p-4 rounded-full bg-muted-foreground/10">
              <ImageIcon className="w-8 h-8" />
            </div>
            <p className="text-sm">Your generated ad will appear here</p>
          </div>
        )}

        {/* Original image — always behind */}
        {originalB64 && (
          <img
            src={`data:image/jpeg;base64,${originalB64}`}
            alt="Original"
            className="absolute inset-0 w-full h-full object-contain"
            draggable={false}
          />
        )}

        {/* Generated image — clipped to left portion of slider */}
        {resultB64 && (
          <img
            src={`data:image/png;base64,${resultB64}`}
            alt="Generated"
            className="absolute inset-0 w-full h-full object-contain"
            style={showSlider ? { clipPath: `inset(0 ${100 - sliderX}% 0 0)` } : undefined}
            draggable={false}
          />
        )}

        {/* Slider handle */}
        {showSlider && (
          <>
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_6px_rgba(0,0,0,0.5)] z-10 pointer-events-none"
              style={{ left: `${sliderX}%` }}
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center cursor-col-resize touch-none"
              style={{ left: `${sliderX}%` }}
              onMouseDown={(e) => { e.preventDefault(); dragging.current = true }}
              onTouchStart={() => { dragging.current = true }}
            >
              <span className="text-[10px] font-bold text-muted-foreground select-none">⇔</span>
            </div>
            <div className="absolute top-2 left-2 z-10 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded pointer-events-none">
              Generated
            </div>
            <div className="absolute top-2 right-2 z-10 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded pointer-events-none">
              Original
            </div>
          </>
        )}
      </div>

      {resultB64 && (
        <Button variant="outline" size="sm" className="gap-2 self-end" onClick={handleDownload}>
          <Download className="w-3.5 h-3.5" />
          Download
        </Button>
      )}
    </div>
  )
}
