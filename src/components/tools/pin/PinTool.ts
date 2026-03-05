import { StateNode, TLEventHandlers, createShapeId } from "tldraw";
import { getShapesToBindAtPoint } from "./getShapesToBindAtPoint";

export class PinTool extends StateNode {
  static override id = "pin";

  override onEnter = () => {
    this.editor.setCursor({ type: "cross" });
  };

  override onPointerDown: TLEventHandlers["onPointerDown"] = () => {
    const { currentPagePoint } = this.editor.inputs;
    const pinId = createShapeId();

    const shapesToBind = getShapesToBindAtPoint(this.editor, currentPagePoint);

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

      // Attach the pin to the shape(s) so moving any of them moves the pin (and each other)
      if (shapesToBind.length >= 2) {
        // Overlapping shapes: bind each pair so moving one moves the others and the pin
        for (let i = 0; i < shapesToBind.length; i++) {
          for (let j = i + 1; j < shapesToBind.length; j++) {
            this.editor.createBinding({
              type: "pin-binding",
              fromId: shapesToBind[i].id,
              toId: shapesToBind[j].id,
              props: {
                pinId,
                anchor: { x: 0.5, y: 0.5 },
              },
            });
          }
        }
      } else if (shapesToBind.length === 1) {
        // Single shape: bind the shape to itself so moving it moves the pin
        const shapeId = shapesToBind[0].id;
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

      // Keep pin always on top so it never goes behind other shapes
      this.editor.bringToFront([pinId]);
    });

    this.editor.setCurrentTool("select");
  };

  override onCancel = () => {
    this.editor.setCurrentTool("select");
  };
}
