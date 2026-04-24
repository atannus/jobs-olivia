export const H_GAP = 640
export const V_GAP = 420

export function computeChildPosition(
  parentPosition: { x: number; y: number },
  siblingCount: number
): { x: number; y: number } {
  return {
    x: parentPosition.x + H_GAP,
    y: parentPosition.y + siblingCount * V_GAP,
  }
}
