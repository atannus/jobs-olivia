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

**Single-page Next.js 16 app** with App Router. The page (`app/page.tsx`) is a `"use client"` component that owns all state as an immutable `TreeNode` tree and renders it through a React Flow canvas.

The UX is a **branching canvas**: each image node can spawn multiple children via prompt edges. Each generation adds a new sibling edge so the user can keep iterating from any node in the tree, not just the latest result.

### API Routes (`app/api/`)

| Route | Purpose |
|---|---|
| `/api/analyze` | GPT-4o Vision: analyzes uploaded image → `ProductAnalysis` (product type, colors, 3 suggested prompts) |
| `/api/generate` | GPT-4o improves the prompt, then `gpt-image-1` edits the image → base64 PNG. Accepts `quality` (`"low"` \| `"high"`) and `isSourceEdit` (selects which system prompt to use). |
| `/api/chat` | GPT-4o conversational iteration (exists but not wired to the current canvas UI) |

All routes call `getOpenAI()` from `lib/openai.ts` (lazy singleton, not module-level to avoid build-time errors).

### Key design decisions

- **Tree state**: All image nodes and their relationships are stored as a single `TreeNode` tree in React state. `lib/tree.ts` converts this tree to React Flow `nodes`/`edges` on every render via `treeToFlow()`.
- **Prompt on edges**: The prompt input lives on the `PromptEdge` custom edge component, not in a separate panel. Submitting a prompt transitions the edge to `"generating"` and the target node to `"loading"`.
- **Branching**: When an edge is submitted, `onEdgeSubmit` immediately adds a new sibling draft edge from the same parent — so the user can type the next variation before the current one finishes.
- **Per-node image source**: Generation always edits the *parent* node's image (`parent.imageB64`), not the original upload. Branching from a generated image edits that image, not the root.
- **Image flow**: Browser `FileReader` → base64 string → JSON body to API routes. `gpt-image-1` accepts a `File` object; the route converts `Buffer.from(b64, "base64")` → `new File(...)`.
- **No mask**: `gpt-image-1` without a mask does a full-scene transformation rather than targeted inpainting. Intentional — gives more creative latitude.
- **Quality toggle**: Header HD button switches `quality` between `"low"` and `"high"`, passed to `/api/generate`. State is in `qualityRef` so in-flight requests always use the value at submission time.
- **Test mode**: Header Flask button skips real API calls and returns the source image after a 2 s delay. Useful for layout/UX iteration without spending API credits.
- **Draft text preservation**: `draftTextsRef` (a `Map<edgeId, string>`) keeps textarea values across re-renders because React Flow unmounts/remounts edge components on viewport changes.
- **Stable callbacks**: `callbacksRef` + `stableOnImageReady` / `stableOnSubmit` refs prevent React Flow node/edge re-renders when the closures are recreated.
- **Layout**: `lib/layout.ts` defines `NODE_WIDTH/HEIGHT` (512 px) and `H_GAP/V_GAP` (900/80 px). `lib/tree.ts::layoutTree` computes positions top-down so sibling subtrees don't overlap.

### Component map

```
app/page.tsx              ← all state (tree, quality, testMode), coordinates API calls
components/
  Canvas.tsx              ← ReactFlow + ReactFlowProvider wrapper; registers custom node/edge types
  ImageNodeCard.tsx       ← custom React Flow node: upload / placeholder / loading / done / error states
  PromptEdge.tsx          ← custom React Flow edge: inline prompt textarea → generate button; orthogonal elbow path
  ImageUpload.tsx         ← drag-and-drop, FileReader → base64, 4 MB limit (used inside ImageNodeCard)
lib/
  tree.ts                 ← TreeNode CRUD (updateNode, updateEdge, addChild, findParent), layout, treeToFlow
  layout.ts               ← layout constants (NODE_WIDTH, NODE_HEIGHT, H_GAP, V_GAP)
  openai.ts               ← getOpenAI() lazy singleton
  prompts.ts              ← system prompts for analyze/improve/edit/chat
  types.ts                ← shared TypeScript types (TreeNode, ImageNodeData, PromptEdgeData, …)
```

> `components/ConversationPanel.tsx`, `LeftPanel.tsx`, `ImageTimeline.tsx`, `ProductInfoCard.tsx`, `PromptInput.tsx`, and `ResultViewer.tsx` are present but not imported anywhere — they are dead code from earlier iterations.
