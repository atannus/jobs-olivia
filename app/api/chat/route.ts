import { NextRequest } from "next/server"
import { getOpenAI } from "@/lib/openai"
import { CHAT_SYSTEM_PROMPT } from "@/lib/prompts"
import type { ChatMessage, ChatResponse } from "@/lib/types"

export async function POST(request: NextRequest) {
  try {
    const {
      messages,
      productType,
      userMessage,
    }: {
      messages: ChatMessage[]
      productType: string
      userMessage: string
    } = await request.json()

    const systemPrompt = `${CHAT_SYSTEM_PROMPT}\n\nProduct context: ${productType}`

    const historyMessages = messages.slice(-10).map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }))

    const openai = getOpenAI()
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        ...historyMessages,
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
