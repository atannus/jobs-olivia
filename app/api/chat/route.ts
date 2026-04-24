import { NextRequest } from "next/server"
import type { ChatCompletionContentPart } from "openai/resources"
import { getOpenAI } from "@/lib/openai"
import { CHAT_SYSTEM_PROMPT } from "@/lib/prompts"
import type { ChatMessage, ChatResponse } from "@/lib/types"

export async function POST(request: NextRequest) {
  try {
    const {
      messages,
      currentImageB64,
      userMessage,
    }: {
      messages: ChatMessage[]
      currentImageB64: string | null
      userMessage: string
    } = await request.json()

    const historyMessages = messages.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }))

    const userContent: ChatCompletionContentPart[] = [
      { type: "text", text: userMessage },
    ]

    if (currentImageB64) {
      userContent.unshift({
        type: "image_url",
        image_url: { url: `data:image/jpeg;base64,${currentImageB64}` },
      })
    }

    const openai = getOpenAI()
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: CHAT_SYSTEM_PROMPT },
        ...historyMessages,
        { role: "user", content: userContent },
      ],
      max_tokens: 400,
    })

    const raw = response.choices[0].message.content ?? "{}"
    const result: ChatResponse = JSON.parse(raw)

    return Response.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    console.error("[chat]", message)
    return Response.json({ error: message }, { status: 500 })
  }
}
