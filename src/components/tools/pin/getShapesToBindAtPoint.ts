import type { Editor, TLShape, TLShapeId } from "tldraw";

/**
 * Returns all shapes that should be bound to a pin placed at the given page point:
 * shapes under the point plus any shapes that overlap them (transitively).
 * Excludes pin and camera shapes.
 */
export function getShapesToBindAtPoint(
  editor: Editor,
  pagePoint: { x: number; y: number }
): TLShape[] {
  const shapesAtPoint = editor
    .getShapesAtPoint(pagePoint)
    .filter((shape) => shape.type !== "pin" && shape.type !== "camera");

  const shapeIdsToBind = new Set<TLShapeId>(shapesAtPoint.map((s) => s.id));
  let added = true;
  while (added) {
    added = false;
    for (const id of Array.from(shapeIdsToBind)) {
      const shape = editor.getShape(id);
      if (!shape) continue;
      const bounds = editor.getShapePageBounds(shape);
      if (!bounds) continue;
      const pageShapes = editor.getCurrentPageShapes();
      for (const other of pageShapes) {
        if (other.type === "pin" || other.type === "camera") continue;
        if (shapeIdsToBind.has(other.id)) continue;
        const otherBounds = editor.getShapePageBounds(other);
        if (!otherBounds) continue;
        if (bounds.collides(otherBounds)) {
          shapeIdsToBind.add(other.id);
          added = true;
        }
      }
    }
  }

  return Array.from(shapeIdsToBind)
    .map((id) => editor.getShape(id))
    .filter((s): s is TLShape => s != null);
}
