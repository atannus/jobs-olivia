export const NODE_WIDTH = 300
export const NODE_HEIGHT = 300

// Horizontal distance from parent node's x to child node's x.
// Leaves ~300px of gap between card edges for the prompt label to sit in.
export const H_GAP = 600

// Vertical stride between sibling branches.
export const V_STEP = 360

/** X position of a child node given its parent's x. */
export function getChildX(parentX: number): number {
  return parentX + H_GAP
}

/**
 * Compute Y positions for N children, symmetrically centered on the parent.
 * Returns an array of `count` y-values (top-left corner of each child node).
 */
export function getBalancedYPositions(parentY: number, count: number): number[] {
  const parentCenterY = parentY + NODE_HEIGHT / 2
  return Array.from({ length: count }, (_, i) => {
    const offset = (i - (count - 1) / 2) * V_STEP
    return parentCenterY - NODE_HEIGHT / 2 + offset
  })
}
