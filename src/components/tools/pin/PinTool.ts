import { StateNode, TLEventHandlers, createShapeId } from "tldraw";

export class PinTool extends StateNode {
  static override id = "pin";

  override onEnter = () => {
    this.editor.setCursor({ type: "cross" });
  };

  override onPointerDown: TLEventHandlers["onPointerDown"] = () => {
    const { currentPagePoint } = this.editor.inputs;
    const pinId = createShapeId();

    // Find shapes under the pin tip (where user clicked) before creating the pin
    const shapesAtPoint = this.editor
      .getShapesAtPoint(currentPagePoint)
      .filter((shape) => shape.type !== "pin" && shape.type !== "camera");

    // Single undoable operation: create pin + bindings via Editor API
    this.editor.run(() => {
      this.editor.createShape({
        id: pinId,
        type: "pin",
        x: currentPagePoint.x - 16,
        y: currentPagePoint.y - 48, // Tip of pin at cursor
        props: {
          w: 32,
          h: 48,
          color: "#ef4444",
        },
      });

      // Attach the pin to the shape(s) under it so moving any of them moves the pin (and each other)
      if (shapesAtPoint.length >= 2) {
        // Overlapping shapes: bind each pair so moving one moves the others and the pin
        for (let i = 0; i < shapesAtPoint.length; i++) {
          for (let j = i + 1; j < shapesAtPoint.length; j++) {
            this.editor.createBinding({
              type: "pin-binding",
              fromId: shapesAtPoint[i].id,
              toId: shapesAtPoint[j].id,
              props: {
                pinId,
                anchor: { x: 0.5, y: 0.5 },
              },
            });
          }
        }
      } else if (shapesAtPoint.length === 1) {
        // Single shape: bind the shape to itself so moving it moves the pin
        const shapeId = shapesAtPoint[0].id;
        this.editor.createBinding({
          type: "pin-binding",
          fromId: shapeId,
          toId: shapeId,
          props: {
            pinId,
            anchor: { x: 0.5, y: 0.5 },
          },
        });
      }
    });

    this.editor.setCurrentTool("select");
  };

  override onCancel = () => {
    this.editor.setCurrentTool("select");
  };
}
