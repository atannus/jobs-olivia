import { NextRequest } from "next/server"
import { getOpenAI } from "@/lib/openai"
import { ANALYZE_SYSTEM_PROMPT } from "@/lib/prompts"
import type { ProductAnalysis } from "@/lib/types"

export async function POST(request: NextRequest) {
  try {
    const { imageB64 } = await request.json()

    if (!imageB64) {
      return Response.json({ error: "imageB64 is required" }, { status: 400 })
    }

    const openai = getOpenAI()
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: ANALYZE_SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: { url: `data:image/jpeg;base64,${imageB64}` },
            },
            { type: "text", text: "Analyze this product image." },
          ],
        },
      ],
      max_tokens: 600,
    })

    const raw = response.choices[0].message.content ?? "{}"
    const analysis: ProductAnalysis = JSON.parse(raw)

    return Response.json(analysis)
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    console.error("[analyze]", message)
    return Response.json({ error: message }, { status: 500 })
  }
}
