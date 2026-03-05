"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Tldraw, Editor, Box, DefaultToolbar } from "tldraw";
import { CustomToolbar } from "@/components/canvas/CustomToolbar";
import { PinShapeUtil } from "@/components/tools/pin/PinShapeUtil";
import { PinTool } from "@/components/tools/pin/PinTool";
import { PinBindingUtil } from "@/components/tools/pin/PinBindingUtil";
import { getShapesToBindAtPoint } from "@/components/tools/pin/getShapesToBindAtPoint";
import { CameraShapeUtil } from "@/components/tools/camera/CameraShapeUtil";
import { CameraTool } from "@/components/tools/camera/CameraTool";
import { ExportDialog } from "@/components/tools/camera/ExportDialog";

const customShapeUtils = [PinShapeUtil, CameraShapeUtil];

const customTools = [PinTool, CameraTool];

const customBindingUtils = [PinBindingUtil];

interface TldrawCanvasProps {
  className?: string;
}

export function TldrawCanvas({ className }: TldrawCanvasProps) {
  const [editor, setEditor] = useState<Editor | null>(null);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportBounds, setExportBounds] = useState<Box | null>(null);
  const [exportShapeId, setExportShapeId] = useState<string | null>(null);
  const pinPositionsRef = useRef<Map<string, { x: number; y: number }>>(new Map());

  // Handle camera capture complete event
  useEffect(() => {
    const handleCaptureComplete = (e: CustomEvent) => {
      const { shapeId, bounds } = e.detail;
      setExportShapeId(shapeId);
      setExportBounds(bounds);
      setExportDialogOpen(true);
    };

    window.addEventListener(
      "camera-capture-complete",
      handleCaptureComplete as EventListener
    );

    return () => {
      window.removeEventListener(
        "camera-capture-complete",
        handleCaptureComplete as EventListener
      );
    };
  }, []);

  // Handle keyboard shortcuts
  useEffect(() => {
    if (!editor) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "p" || e.key === "P") {
        editor.setCurrentTool("pin");
      } else if (e.key === "c" || e.key === "C") {
        // Only if not typing in an input
        if (
          document.activeElement?.tagName !== "INPUT" &&
          document.activeElement?.tagName !== "TEXTAREA"
        ) {
          editor.setCurrentTool("camera");
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [editor]);

  // Keep pin in front when moved, and re-bind when pin is dragged to a different shape (or group)
  useEffect(() => {
    if (!editor) return;

    return editor.store.listen(() => {
      const pins = editor.getCurrentPageShapes().filter((s) => s.type === "pin") as Array<{
        id: string;
        x: number;
        y: number;
        props: { w?: number; h?: number };
      }>;
      const toFront: string[] = [];

      for (const pin of pins) {
        const pos = { x: pin.x, y: pin.y };
        const prev = pinPositionsRef.current.get(pin.id);
        pinPositionsRef.current.set(pin.id, pos);

        const moved = prev && (prev.x !== pos.x || prev.y !== pos.y);
        if (moved) toFront.push(pin.id);
        if (!moved) continue;

        // Pin position changed: either binding moved it (shapes moved) or user dragged it
        const w = pin.props?.w ?? 32;
        const h = pin.props?.h ?? 48;
        const pinTip = { x: pin.x + w / 2, y: pin.y + h };

        const boundShapeIds = new Set<string>();
        const bindingIdsToRemove = new Set<string>();
        for (const shape of editor.getCurrentPageShapes()) {
          if (shape.type === "pin" || shape.type === "camera") continue;
          for (const b of [
            ...editor.getBindingsFromShape(shape, "pin-binding"),
            ...editor.getBindingsToShape(shape, "pin-binding"),
          ]) {
            const props = b.props as { pinId?: string };
            if (props.pinId !== pin.id) continue;
            boundShapeIds.add(b.fromId);
            boundShapeIds.add(b.toId);
            if ("id" in b && typeof (b as { id: string }).id === "string") {
              bindingIdsToRemove.add((b as { id: string }).id);
            }
          }
        }

        const shapesAtTip = editor
          .getShapesAtPoint(pinTip)
          .filter((s) => s.type !== "pin" && s.type !== "camera");
        const tipStillOverBound = shapesAtTip.some((s) => boundShapeIds.has(s.id));

        if (tipStillOverBound) {
          // Pin moved with the group; no re-bind
          continue;
        }

        // User dragged pin to a new location: re-bind to shapes under the new tip
        const shapesToBind = getShapesToBindAtPoint(editor, pinTip);
        editor.run(() => {
          if (bindingIdsToRemove.size > 0) {
            editor.store.remove(Array.from(bindingIdsToRemove) as any[]);
          }
          if (shapesToBind.length >= 2) {
            for (let i = 0; i < shapesToBind.length; i++) {
              for (let j = i + 1; j < shapesToBind.length; j++) {
                editor.createBinding({
                  type: "pin-binding",
                  fromId: shapesToBind[i].id,
                  toId: shapesToBind[j].id,
                  props: {
                    pinId: pin.id,
                    anchor: { x: 0.5, y: 0.5 },
                  },
                });
              }
            }
          } else if (shapesToBind.length === 1) {
            const shapeId = shapesToBind[0].id;
            editor.createBinding({
              type: "pin-binding",
              fromId: shapeId,
              toId: shapeId,
              props: {
                pinId: pin.id,
                anchor: { x: 0.5, y: 0.5 },
              },
            });
          }
        });
      }

      if (toFront.length > 0) {
        editor.bringToFront(toFront);
      }
    });
  }, [editor]);

  const handleMount = useCallback((editor: Editor) => {
    setEditor(editor);
  }, []);

  const handleExportDialogClose = useCallback(() => {
    setExportDialogOpen(false);
    setExportBounds(null);
    setExportShapeId(null);
  }, []);

  return (
    <div className={`relative w-full h-full ${className || ""}`}>
      <Tldraw
        onMount={handleMount}
        shapeUtils={customShapeUtils}
        tools={customTools}
        bindingUtils={customBindingUtils}
        components={{
          Toolbar: DefaultToolbar,
        }}
      />
      {editor && (
        <CustomToolbar editor={editor} />
      )}
      <ExportDialog
        isOpen={exportDialogOpen}
        onClose={handleExportDialogClose}
        editor={editor}
        bounds={exportBounds}
        shapeId={exportShapeId}
      />
    </div>
  );
}
