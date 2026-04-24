"use client"

import { useRef, useState } from "react"
import { Upload, ImageIcon } from "lucide-react"

interface ImageUploadProps {
  onImageReady: (b64: string, mimeType: string) => void
  disabled?: boolean
}

export function ImageUpload({ onImageReady, disabled }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  function processFile(file: File) {
    if (!file.type.startsWith("image/")) return
    if (file.size > 4 * 1024 * 1024) {
      alert("Image must be under 4MB")
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string
      setPreview(dataUrl)
      const b64 = dataUrl.split(",")[1]
      onImageReady(b64, file.type)
    }
    reader.readAsDataURL(file)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }

  return (
    <div
      className={`relative rounded-xl border-2 border-dashed transition-colors cursor-pointer
        ${isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}
        ${disabled ? "opacity-50 pointer-events-none" : ""}
      `}
      style={{ aspectRatio: "1/1", minHeight: 200 }}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) processFile(file)
        }}
      />

      {preview ? (
        <img
          src={preview}
          alt="Product"
          className="w-full h-full object-contain rounded-xl"
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-muted-foreground">
          <div className="p-3 rounded-full bg-muted">
            <ImageIcon className="w-6 h-6" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium">Drop product image here</p>
            <p className="text-xs mt-0.5">or click to browse · max 4MB</p>
          </div>
          <Upload className="w-4 h-4 opacity-50" />
        </div>
      )}
    </div>
  )
}
