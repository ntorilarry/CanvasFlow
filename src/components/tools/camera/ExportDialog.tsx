"use client";

import { Fragment, useState, useCallback, useEffect } from "react";
import { Dialog, Transition, RadioGroup } from "@headlessui/react";
import { FiX, FiDownload, FiCopy, FiCheck } from "react-icons/fi";
import { Editor, Box } from "tldraw";
import Image from "next/image";

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  editor: Editor | null;
  bounds: Box | null;
  shapeId: string | null;
}

type ExportFormat = "png" | "jpeg";

export function ExportDialog({
  isOpen,
  onClose,
  editor,
  bounds,
  shapeId,
}: ExportDialogProps) {
  const [format, setFormat] = useState<ExportFormat>("png");
  const [quality, setQuality] = useState(0.92);
  const [filename, setFilename] = useState("screenshot");
  const [isExporting, setIsExporting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Generate preview when dialog opens
  useEffect(() => {
    if (!isOpen || !editor || !bounds) {
      setPreviewUrl(null);
      return;
    }

    const generatePreview = async () => {
      try {
        const idsInBounds = editor
          .getCurrentPageShapes()
          .filter((shape) => {
            if (shape.id === shapeId) return false;
            if (shape.type === "camera") return false;
            const shapeBounds = editor.getShapePageBounds(shape);
            if (!shapeBounds) return false;
            return bounds.collides(shapeBounds);
          })
          .map((s) => s.id);

        if (idsInBounds.length === 0) {
          setPreviewUrl(null);
          return;
        }

        const { blob } = await editor.toImage(idsInBounds, {
          format: "png",
          bounds,
          background: true,
          padding: 0,
          scale: 1,
          pixelRatio: 1,
        });

        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
      } catch (error) {
        console.error("Failed to generate preview:", error);
      }
    };

    generatePreview();

    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [isOpen, editor, bounds, shapeId, previewUrl]);

  const handleExport = useCallback(
    async (action: "download" | "clipboard") => {
      if (!editor || !bounds) return;

      setIsExporting(true);

      try {
        const idsInBounds = editor
          .getCurrentPageShapes()
          .filter((shape) => {
            if (shape.id === shapeId) return false;
            if (shape.type === "camera") return false;
            const shapeBounds = editor.getShapePageBounds(shape);
            if (!shapeBounds) return false;
            return bounds.collides(shapeBounds);
          })
          .map((s) => s.id);

        if (idsInBounds.length === 0) {
          alert("No shapes in the cropped area. Draw something in the selection first.");
          setIsExporting(false);
          return;
        }

        const { blob } = await editor.toImage(idsInBounds, {
          format,
          bounds,
          background: true,
          padding: 0,
          scale: 1,
          pixelRatio: 2,
          ...(format === "jpeg" && { quality: quality }),
        });

        if (action === "download") {
          // Download the file
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `${filename}.${format}`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          onClose();
        } else {
          // Copy to clipboard
          try {
            await navigator.clipboard.write([
              new ClipboardItem({
                [blob.type]: blob,
              }),
            ]);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          } catch (err) {
            // Fallback for browsers that don't support ClipboardItem
            console.error("Clipboard write failed:", err);
            alert("Failed to copy to clipboard. Try downloading instead.");
          }
        }

        // Delete the camera shape after export
        if (shapeId) {
          editor.deleteShape(shapeId as any);
        }
      } catch (error) {
        console.error("Export failed:", error);
        alert("Export failed. Please try again.");
      } finally {
        setIsExporting(false);
      }
    },
    [editor, bounds, format, quality, shapeId, filename, onClose]
  );

  const handleClose = () => {
    // Delete the camera shape when closing without export
    if (editor && shapeId) {
      editor.deleteShape(shapeId as any);
    }
    onClose();
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/40" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-xl bg-white shadow-2xl transition-all">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
                  <Dialog.Title className="text-lg font-semibold text-gray-900">
                    Export Screenshot
                  </Dialog.Title>
                  <button
                    onClick={handleClose}
                    className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                  >
                    <FiX size={20} />
                  </button>
                </div>

                {/* Content */}
                <div className="px-5 py-4 space-y-5">
                  {/* Preview */}
                  {previewUrl && (
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-2">
                      <Image
                        src={previewUrl}
                        alt="Preview"
                        className="w-full h-40 object-contain"
                        height={1000}
                        width={1000}
                      />
                    </div>
                  )}

                  {/* Format selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Format
                    </label>
                    <RadioGroup
                      value={format}
                      onChange={setFormat}
                      className="flex gap-3"
                    >
                      <RadioGroup.Option value="png">
                        {({ checked }) => (
                          <button
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                              checked
                                ? "bg-blue-500 text-white"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            }`}
                          >
                            PNG
                          </button>
                        )}
                      </RadioGroup.Option>
                      <RadioGroup.Option value="jpeg">
                        {({ checked }) => (
                          <button
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                              checked
                                ? "bg-blue-500 text-white"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            }`}
                          >
                            JPEG
                          </button>
                        )}
                      </RadioGroup.Option>
                    </RadioGroup>
                  </div>

                  {/* Quality slider for JPEG */}
                  {format === "jpeg" && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Quality: {Math.round(quality * 100)}%
                      </label>
                      <input
                        type="range"
                        min="0.1"
                        max="1"
                        step="0.01"
                        value={quality}
                        onChange={(e) => setQuality(parseFloat(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
                      />
                    </div>
                  )}

                  {/* Filename */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Filename
                    </label>
                    <div className="flex items-center">
                      <input
                        type="text"
                        value={filename}
                        onChange={(e) => setFilename(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="screenshot"
                      />
                      <span className="ml-2 text-sm text-gray-500">
                        .{format}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex gap-3 border-t border-gray-200 px-5 py-4">
                  <button
                    onClick={() => handleExport("clipboard")}
                    disabled={isExporting}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
                  >
                    {copied ? (
                      <>
                        <FiCheck size={18} />
                        Copied!
                      </>
                    ) : (
                      <>
                        <FiCopy size={18} />
                        Copy to Clipboard
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleExport("download")}
                    disabled={isExporting}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors disabled:opacity-50"
                  >
                    <FiDownload size={18} />
                    Download
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
