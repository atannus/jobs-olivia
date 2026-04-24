# PROMPTS.md: Evolution Derived from Commit History

This reconstructs the prompts that drove the project by reading what each commit actually changed. No session transcripts were used; only diffs and commit messages.

---

## The Challenge

> Build an AI-powered product ad generator. Given a product image and a text prompt, build a small web app that accepts an image upload, uses at least one AI API to generate a new creative asset, and displays the result in a clean, interactive UI. Bonus points for conversational iteration, agentic behavior (auto-detecting product type, suggesting prompt improvements), a canvas or editor feel, and clean UX.

*(Full text in `the-olivia-agentic-developer-test`.)*

---

## Commit-by-Commit Evolution

### `803aa16`: Initial commit from Create Next App
**What it was:** Standard Next.js scaffold with TypeScript, Tailwind, and App Router. Nothing app-specific.

**Inferred prompt:**
> Set up a new Next.js 16 project with TypeScript, Tailwind CSS, and the App Router.

---

### `51ffcc3`: Olivia - claude one-shot.
**What changed:** 24 files, ~4700 lines added. The entire application built in one pass.
- Three API routes: `/api/analyze` (GPT-4o Vision → product type + colors + suggested prompts), `/api/generate` (GPT-4o prompt improvement → gpt-image-1 edit → base64 PNG), `/api/chat` (conversational iteration with `shouldGenerate` signal)
- Five components: `ImageUpload` (drag-and-drop, 4 MB limit), `ProductInfoCard` (analysis result + clickable chips), `PromptInput` (textarea + generate button), `ResultViewer` (before/after slider via CSS `clipPath`), `ConversationPanel` (chat thread)
- shadcn/ui primitives, OpenAI lazy singleton, system prompts, shared types

**Inferred prompt:**
> Build an AI product ad generator. The user uploads a product image; the app analyzes it with GPT-4o Vision to detect product type, colors, and suggest three prompts. The user picks or writes a prompt; GPT-4o improves it; gpt-image-1 edits the image. Show the original and generated image side-by-side with a draggable before/after slider. Add a chat panel so the user can iterate conversationally; the chat API decides whether to regenerate. Use shadcn/ui. Store the OpenAI client as a lazy singleton.

---

### `86a25be`: Improves ui/ux.
**What changed:** Replaced the original component layout with `LeftPanel` (sidebar) + `ImageTimeline` (horizontal strip of all generated images). State refactored from individual result fields to `steps: IterationStep[]` + `messages: ChatMessage[]`. The UI became two full-height panels that scroll independently.

**Inferred prompt:**
> The UX is bad. The panels grow and scroll independently in a confusing way. Make the UI always fill the screen. Put the conversation and prompt on the left as a sidebar; show all generated images in a horizontal scrollable timeline on the right so I can see the full iteration history.

---

### `18b2220`: Experiments with a moving canvas ux.
**What changed:** Added `@xyflow/react`. `LeftPanel` and `ImageTimeline` replaced by `Canvas.tsx` (ReactFlow wrapper) and `ImageNodeCard.tsx` (custom node). State shifted from `IterationStep[]` to flat `nodes[]`/`edges[]` via `useNodesState`/`useEdgesState`. `lib/layout.ts` introduced with `computeChildPosition()`. Nodes were draggable.

**Inferred prompt:**
> Scrap the side panel. I want a canvas feel where the images are nodes on an infinite, pannable canvas. Each generation spawns a child node connected to its parent. Use React Flow. The reference image starts centered in the left third of the screen.

---

### `d7e235f`: Improves position rebalancing and component alignment.
**What changed:** `PromptEdge.tsx` introduced: prompt input moved off the node card and onto a custom React Flow edge (inline textarea + Generate button between nodes). `lib/layout.ts` replaced `computeChildPosition()` with `getBalancedYPositions()` which centers siblings symmetrically around the parent's vertical midpoint. Test mode toggle (FlaskConical) added to header. Nodes made non-draggable.

**Inferred prompt:**
> The prompt shouldn't be inside the node. Put it on the connecting line between parent and child, a text box that lives on the edge. When submitted it kicks off generation. Also: siblings should be vertically centered on their parent, not just stacked downward. Add a test mode that skips API calls so I can iterate on layout quickly. Lock the nodes so the canvas pans instead of dragging individual images.

---

### `af2f13a`: Improves tree rendering.
**What changed:** `lib/tree.ts` created: `TreeNode` becomes the single source of truth. `treeToFlow()` derives React Flow nodes and edges via `useMemo`. `layoutTree()` is a two-pass recursive algorithm: bottom-up `subtreeHeight()` then top-down position assignment. `page.tsx` dropped `useNodesState`/`useEdgesState` in favour of `useState<TreeNode>`. This fixed the rebalancing bug where adding to an early column only shifted direct siblings, not the whole subtree below.

**Inferred prompt:**
> Adding a branch to an early column only rebalances direct siblings, not the full subtree below. Rethink the layout: store the tree as a single recursive data structure and compute all React Flow positions from scratch on every change using a proper recursive layout algorithm.

---

### `778832c`: Fixes tree rendering.
**What changed:** `getBezierPath` removed. Custom `elbowPath()` function written: exits source node right, makes a short horizontal step, bends up or down with a rounded arc (radius-clamped to available space), travels vertically to the target's row, bends horizontally with another arc, arrives at the target left edge. Label positioned on the final horizontal segment.

**Inferred prompt:**
> The connecting lines are wrong. I see nothing, just a tiny arrowhead at the left edge of each child. I need clean orthogonal lines: exit the parent on the right, bend to the child's height, arrive at the child on the left. Rounded corners. No arrowhead needed, just the line.

---

### `37454d2`: Fixes source image when branching.
**What changed:** `onEdgeSubmit` now reads `parent.imageB64 ?? sourceB64Ref.current`, so generation edits the *parent node's* image, not always the root upload. `isSourceEdit` flag passed to `/api/generate` to select between `IMPROVE_PROMPT_SYSTEM` (creative expansion for source images) and `EDIT_PROMPT_SYSTEM` (targeted modification for already-generated images). `quality` state + `qualityRef` added; HD toggle (Sparkles) wired to `/api/generate`.

**Inferred prompt:**
> The image chain is broken. When I branch off a generated image, the model reverts to the original upload instead of editing that generated image. Fix it so each generation edits its parent. Also add HD vs low quality toggle. I think quality was hardcoded to low and that's why the product gets mangled in child images.

---

### `d57ef6c`: Improves ui.
**What changed:** Test mode default flipped to `false`. "Improved prompt" caption below each image node removed. Prompt label in `"done"` edge state: removed `line-clamp-2`, widened max-width, removed `line-clamp-2` on generating state too.

**Inferred prompt:**
> Make test mode off by default. Remove the improved prompt text that shows below the image; it's redundant since the prompt is already on the edge. Make sure the prompt label on the edge isn't clipped.

---

### `3bfa2d2`: Increases max zoom so we can enjoy the full 1024 image.
**What changed:** `NODE_WIDTH`/`NODE_HEIGHT` increased 300 → 512. `H_GAP` 600 → 900, `V_GAP` 60 → 80. Canvas initial pan updated to use the new constants. `maxZoom` set to `2` explicitly.

**Inferred prompt:**
> The model outputs 1024×1024 but the cards are only 300px. Increase the node size to 512 and widen the gaps so the layout doesn't feel cramped. At max zoom the image should fill its card at full resolution.

---

### `39813c6`: Fixes text clearing on image upload.
**What changed:** `startedInteractingRef` added. The `/api/analyze` callback only updates `productType` on the source node if `!startedInteractingRef.current`. Each prompt edge fires `onInteract` on first keystroke, which sets the ref. This prevents a re-render triggered by the analyze response from overwriting text the user already typed.

**Inferred prompt:**
> When I upload an image and start typing in the prompt box, a couple of seconds later the text gets wiped, probably when the analyze response arrives and triggers a re-render. Fix it so typing in the prompt suppresses any state update from the background analyze call.

---

### `1a35dfd`: Prevents data loss on reflow.
**What changed:** `draftTextsRef` (`Map<edgeId, string>`) introduced on `page.tsx`. `getDraftText`/`setDraftText` callbacks injected into each edge's `data`. `PromptEdge` initializes its `useState` with a lazy `getDraftText()` call and calls `setDraftText` on every keystroke. On submit it calls `setDraftText("")`.  

The root cause: React Flow unmounts and remounts edge components whenever the tree changes (new node added, node status changes), resetting all local `useState` to `""`.

**Inferred prompt:**
> After a generation completes and a new sibling edge appears, the text I had typed in another edge gets wiped. React Flow is remounting the edge component. Keep draft text alive outside the component so it survives remounts.

---

### `b55db90`: Repositions toolbar.
**What changed:** Header layout restructured into three equal `w-1/3` columns: title left, controls center, byline + session button right. Title changed from `text-sm font-semibold` to `text-xl font-light italic`.

**Inferred prompt:**
> Move the HD and Test toggles to the center of the header. Make "The Olivia" wordmark larger, thin-weight, and italic. Keep the byline on the right.

---

### `db90810`: Improves docs.
**What changed:** `CLAUDE.md` rewritten to document the canvas architecture, `TreeNode` state model, and all active vs. dead components.

**Inferred prompt:**
> Update the documentation to reflect how the project has evolved: the canvas architecture, tree state, React Flow custom nodes/edges, and which components are dead code.
