"use client";

import { useState, useEffect, useCallback } from "react";
import { Tldraw, Editor, Box, DefaultToolbar } from "tldraw";
import { CustomToolbar } from "@/components/canvas/CustomToolbar";
import { PinShapeUtil } from "@/components/tools/pin/PinShapeUtil";
import { PinTool } from "@/components/tools/pin/PinTool";
import { PinBindingUtil } from "@/components/tools/pin/PinBindingUtil";
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
