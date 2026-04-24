# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev      # start dev server at localhost:3000
npm run build    # production build
npm run lint     # ESLint
npx tsc --noEmit # type-check without building
```

Requires `.env.local` with `OPENAI_API_KEY=sk-...`.

## Architecture

**Single-page Next.js 16 app** with App Router. The page (`app/page.tsx`) is a `"use client"` component that owns all state and calls the three API routes.

### API Routes (`app/api/`)

| Route | Purpose |
|---|---|
| `/api/analyze` | GPT-4o Vision: analyzes uploaded image → `ProductAnalysis` (product type, colors, 3 suggested prompts) |
| `/api/generate` | GPT-4o improves the prompt, then `gpt-image-1` edits the image → base64 PNG |
| `/api/chat` | GPT-4o conversational iteration; returns `{ message, shouldGenerate, generationPrompt }` — the frontend calls `/api/generate` if `shouldGenerate` is true |

All routes call `getOpenAI()` from `lib/openai.ts` (lazy singleton, not module-level to avoid build-time errors).

### Key design decisions

- **Image flow**: Browser `FileReader` → base64 string → JSON body to API routes. `gpt-image-1` accepts a `File` object; the route converts `Buffer.from(b64, "base64")` → `new File(...)`.
- **No mask**: `gpt-image-1` without a mask does a full-scene transformation rather than targeted inpainting. Intentional — gives more creative latitude.
- **Conversation state**: In React state only (no DB). Conversation history is sent to `/api/chat` on every message.
- **Before/after slider**: Uses CSS `clipPath: inset(0 ${100-x}% 0 0)` on the generated image overlay. Both images use `object-contain` so they align.

### Component map

```
app/page.tsx          ← all state, coordinates API calls
components/
  ImageUpload.tsx     ← drag-and-drop, FileReader → base64, 4MB limit
  ProductInfoCard.tsx ← shows analysis result + clickable prompt chips
  PromptInput.tsx     ← textarea + generate button + "✨ Improved" badge
  ResultViewer.tsx    ← before/after slider + download button
  ConversationPanel.tsx ← chat thread, Enter to send
lib/
  openai.ts           ← getOpenAI() lazy singleton
  prompts.ts          ← system prompts for analyze/improve/chat
  types.ts            ← shared TypeScript types
```
