import { StateNode, TLEventHandlers, createShapeId, Box } from "tldraw";

export class CameraTool extends StateNode {
  static override id = "camera";

  private startPoint: { x: number; y: number } | null = null;
  private currentShapeId: string | null = null;

  override onEnter = () => {
    this.editor.setCursor({ type: "cross" });
    this.startPoint = null;
    this.currentShapeId = null;
  };

  override onPointerDown: TLEventHandlers["onPointerDown"] = () => {
    const { currentPagePoint } = this.editor.inputs;
    this.startPoint = { x: currentPagePoint.x, y: currentPagePoint.y };

    // Create the camera shape
    const shapeId = createShapeId();
    this.currentShapeId = shapeId;

    this.editor.createShape({
      id: shapeId,
      type: "camera",
      x: currentPagePoint.x,
      y: currentPagePoint.y,
      props: {
        w: 1,
        h: 1,
      },
    });
  };

  override onPointerMove: TLEventHandlers["onPointerMove"] = () => {
    if (!this.startPoint || !this.currentShapeId) return;

    const { currentPagePoint } = this.editor.inputs;

    // Calculate dimensions
    const minX = Math.min(this.startPoint.x, currentPagePoint.x);
    const minY = Math.min(this.startPoint.y, currentPagePoint.y);
    const width = Math.abs(currentPagePoint.x - this.startPoint.x);
    const height = Math.abs(currentPagePoint.y - this.startPoint.y);

    // Update the shape
    this.editor.updateShape({
      id: this.currentShapeId as any,
      type: "camera",
      x: minX,
      y: minY,
      props: {
        w: Math.max(width, 10),
        h: Math.max(height, 10),
      },
    });
  };

  override onPointerUp: TLEventHandlers["onPointerUp"] = () => {
    if (this.currentShapeId) {
      // Select the camera shape
      this.editor.select(this.currentShapeId as any);

      // Dispatch a custom event to open the export dialog
      const shape = this.editor.getShape(this.currentShapeId as any);
      const props = shape?.props as { w?: number; h?: number } | undefined;
      if (shape && props && (props.w ?? 0) > 20 && (props.h ?? 0) > 20) {
        window.dispatchEvent(
          new CustomEvent("camera-capture-complete", {
            detail: {
              shapeId: this.currentShapeId,
              bounds: new Box(
                shape.x,
                shape.y,
                props.w ?? 0,
                props.h ?? 0
              ),
            },
          })
        );
      }
    }

    this.startPoint = null;
    this.currentShapeId = null;
    this.editor.setCurrentTool("select");
  };

  override onCancel = () => {
    // Delete the current shape if exists
    if (this.currentShapeId) {
      this.editor.deleteShape(this.currentShapeId as any);
    }
    this.startPoint = null;
    this.currentShapeId = null;
    this.editor.setCurrentTool("select");
  };
}
