import {
  BindingUtil,
  TLBaseBinding,
  BindingOnShapeChangeOptions,
  TLShapeId,
  Vec,
  VecModel,
  T,
} from "tldraw";

// Define binding type inline
type PinBinding = TLBaseBinding<
  "pin-binding",
  {
    pinId: string;
    anchor: VecModel;
  }
>;

// Track which shapes are currently being updated to prevent loops
const updatingShapes = new Set<TLShapeId>();

export class PinBindingUtil extends BindingUtil<PinBinding> {
  static override type = "pin-binding" as const;

  static override props = {
    pinId: T.string,
    anchor: T.object({
      x: T.number,
      y: T.number,
    }),
  };

  override getDefaultProps() {
    return {
      pinId: "",
      anchor: { x: 0.5, y: 0.5 },
    };
  }

  // When the "from" shape changes, update the "to" shape
  override onAfterChangeFromShape(options: BindingOnShapeChangeOptions<PinBinding>) {
    this.handleShapeChange(options, "from");
  }

  // When the "to" shape changes, update the "from" shape
  override onAfterChangeToShape(options: BindingOnShapeChangeOptions<PinBinding>) {
    this.handleShapeChange(options, "to");
  }

  private handleShapeChange(
    options: BindingOnShapeChangeOptions<PinBinding>,
    changedSide: "from" | "to"
  ) {
    const { binding, shapeAfter, shapeBefore } = options;

    if (!shapeAfter || !shapeBefore) return;
    if (updatingShapes.has(shapeAfter.id)) return;

    const delta = new Vec(
      shapeAfter.x - shapeBefore.x,
      shapeAfter.y - shapeBefore.y
    );
    if (delta.len() < 0.01) return;

    // Find all bindings for this pin group
    const allBindings = this.editor
      .getBindingsFromShape(shapeAfter, "pin-binding")
      .concat(this.editor.getBindingsToShape(shapeAfter, "pin-binding"));

    const sameGroupBindings = allBindings.filter(
      (b) => (b.props as PinBinding["props"]).pinId === binding.props.pinId
    );

    const shapesToUpdate = new Set<TLShapeId>();
    for (const b of sameGroupBindings) {
      if (b.fromId !== shapeAfter.id) shapesToUpdate.add(b.fromId);
      if (b.toId !== shapeAfter.id) shapesToUpdate.add(b.toId);
    }

    const pinId = binding.props.pinId as TLShapeId;
    const editor = this.editor;
    const deltaX = delta.x;
    const deltaY = delta.y;

    // Mark the shape that moved and all we're about to update so we don't re-enter
    updatingShapes.add(shapeAfter.id);
    shapesToUpdate.forEach((id) => updatingShapes.add(id));
    updatingShapes.add(pinId);

    // Defer so we're not inside the store's sideEffect when we update (avoids sync issues)
    requestAnimationFrame(() => {
      try {
        editor.run(() => {
          const updates: { id: TLShapeId; type: string; x: number; y: number }[] = [];

          for (const id of shapesToUpdate) {
            const shape = editor.getShape(id);
            if (shape) {
              updates.push({
                id,
                type: shape.type,
                x: shape.x + deltaX,
                y: shape.y + deltaY,
              });
            }
          }

          const pin = editor.getShape(pinId);
          if (pin) {
            updates.push({
              id: pin.id,
              type: pin.type,
              x: pin.x + deltaX,
              y: pin.y + deltaY,
            });
          }

          if (updates.length > 0) {
            editor.updateShapes(updates as any);
          }
        });
      } finally {
        updatingShapes.delete(shapeAfter.id);
        shapesToUpdate.forEach((id) => updatingShapes.delete(id));
        updatingShapes.delete(pinId);
      }
    });
  }
}

export type { PinBinding };
