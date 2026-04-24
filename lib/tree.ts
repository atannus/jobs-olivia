import { MarkerType } from "@xyflow/react"
import type { TreeNode, TreeEdge, ImageNode, PromptEdge } from "@/lib/types"
import { NODE_HEIGHT, H_GAP, V_GAP } from "@/lib/layout"

const DEFAULT_MARKER = { type: MarkerType.ArrowClosed, width: 12, height: 12 }

export function subtreeHeight(node: TreeNode): number {
  if (node.children.length === 0) return NODE_HEIGHT
  const total = node.children.reduce((s, { node: c }) => s + subtreeHeight(c), 0)
  return total + (node.children.length - 1) * V_GAP
}

export function layoutTree(root: TreeNode): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>()

  function layout(node: TreeNode, depth: number, topY: number): void {
    const x = depth * H_GAP
    if (node.children.length === 0) {
      positions.set(node.id, { x, y: topY })
      return
    }
    const childHeights = node.children.map(({ node: c }) => subtreeHeight(c))
    const totalH = childHeights.reduce((s, h) => s + h, 0) + (node.children.length - 1) * V_GAP
    positions.set(node.id, { x, y: topY + totalH / 2 - NODE_HEIGHT / 2 })
    let childY = topY
    node.children.forEach(({ node: c }, i) => {
      layout(c, depth + 1, childY)
      childY += childHeights[i] + V_GAP
    })
  }

  layout(root, 0, 0)
  return positions
}

export function treeToFlow(
  root: TreeNode,
  onImageReady: (b64: string, mime: string) => void,
  onSubmit: (childId: string, prompt: string) => void
): { nodes: ImageNode[]; edges: PromptEdge[] } {
  const positions = layoutTree(root)
  const nodes: ImageNode[] = []
  const edges: PromptEdge[] = []

  function walk(node: TreeNode): void {
    const pos = positions.get(node.id) ?? { x: 0, y: 0 }
    nodes.push({
      id: node.id,
      type: "imageNode",
      position: pos,
      data: {
        status: node.status,
        imageB64: node.imageB64,
        mimeType: node.mimeType,
        isSource: node.isSource,
        improvedPrompt: node.improvedPrompt,
        errorMessage: node.errorMessage,
        productType: node.productType,
        onImageReady,
      },
    })
    node.children.forEach(({ edge, node: child }) => {
      edges.push({
        id: edge.id,
        type: "promptEdge",
        source: node.id,
        target: child.id,
        animated: edge.status === "generating",
        markerEnd: DEFAULT_MARKER,
        data: { status: edge.status, prompt: edge.prompt, childId: child.id, onSubmit },
      })
      walk(child)
    })
  }

  walk(root)
  return { nodes, edges }
}

export function updateNode(
  root: TreeNode,
  id: string,
  fn: (n: TreeNode) => TreeNode
): TreeNode {
  if (root.id === id) return fn(root)
  return {
    ...root,
    children: root.children.map(({ edge, node }) => ({
      edge,
      node: updateNode(node, id, fn),
    })),
  }
}

export function updateEdge(
  root: TreeNode,
  childId: string,
  fn: (e: TreeEdge) => TreeEdge
): TreeNode {
  return {
    ...root,
    children: root.children.map(({ edge, node }) =>
      node.id === childId
        ? { edge: fn(edge), node }
        : { edge, node: updateEdge(node, childId, fn) }
    ),
  }
}

export function addChild(
  root: TreeNode,
  parentId: string,
  edge: TreeEdge,
  child: TreeNode
): TreeNode {
  if (root.id === parentId) {
    return { ...root, children: [...root.children, { edge, node: child }] }
  }
  return {
    ...root,
    children: root.children.map(({ edge: e, node }) => ({
      edge: e,
      node: addChild(node, parentId, edge, child),
    })),
  }
}

export function findParent(root: TreeNode, childId: string): TreeNode | null {
  for (const { node } of root.children) {
    if (node.id === childId) return root
    const found = findParent(node, childId)
    if (found) return found
  }
  return null
}
