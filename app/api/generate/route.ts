import { NextRequest } from "next/server"
import { getOpenAI } from "@/lib/openai"
import { IMPROVE_PROMPT_SYSTEM, EDIT_PROMPT_SYSTEM } from "@/lib/prompts"

export async function POST(request: NextRequest) {
  try {
    const { imageB64, prompt, mimeType = "image/jpeg", quality = "low", isSourceEdit = true } = await request.json()

    if (!imageB64 || !prompt) {
      return Response.json(
        { error: "imageB64 and prompt are required" },
        { status: 400 }
      )
    }

    const openai = getOpenAI()

    const improveResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: isSourceEdit ? IMPROVE_PROMPT_SYSTEM : EDIT_PROMPT_SYSTEM },
        { role: "user", content: prompt },
      ],
      max_tokens: 200,
    })
    const improvedPrompt =
      improveResponse.choices[0].message.content?.trim() ?? prompt

    const imageBytes = Buffer.from(imageB64, "base64")
    const imageFile = new File([imageBytes], "product.jpg", { type: mimeType })

    const editResponse = await openai.images.edit({
      model: "gpt-image-1",
      image: imageFile,
      prompt: improvedPrompt,
      n: 1,
      size: "1024x1024",
      quality: quality === "high" ? "high" : "low",
    })

    const resultB64 = editResponse.data?.[0]?.b64_json

    return Response.json({ imageB64: resultB64, improvedPrompt, originalPrompt: prompt })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    console.error("[generate]", message)
    return Response.json({ error: message }, { status: 500 })
  }
}
