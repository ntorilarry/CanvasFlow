"use client";

import { useState, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import { FiMaximize2, FiMinimize2, FiFileText, FiGrid } from "react-icons/fi";

const MOBILE_BREAKPOINT = 768;

type MobileTab = "pdf" | "canvas";

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`).matches
      : false
  );
  useEffect(() => {
    const m = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`);
    const listener = () => setIsMobile(m.matches);
    m.addEventListener("change", listener);
    return () => m.removeEventListener("change", listener);
  }, []);
  return isMobile;
}

// Dynamic imports to avoid SSR issues with tldraw and react-pdf
const TldrawCanvas = dynamic(
  () =>
    import("@/components/canvas/TldrawCanvas").then((mod) => mod.TldrawCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    ),
  }
);

const PdfViewer = dynamic(
  () => import("@/components/pdf/PdfViewer").then((mod) => mod.PdfViewer),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full bg-gray-100">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    ),
  }
);

export default function Home() {
  const isMobile = useIsMobile();
  const [mobileTab, setMobileTab] = useState<MobileTab>("canvas");
  const [pdfPanelWidth, setPdfPanelWidth] = useState(400);
  const [isResizing, setIsResizing] = useState(false);
  const [isPdfCollapsed, setIsPdfCollapsed] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`).matches
      : false
  );

  const minPdfWidth = 300;
  const maxPdfWidth = 600;

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isResizing) return;
      const newWidth = Math.max(minPdfWidth, Math.min(maxPdfWidth, e.clientX));
      setPdfPanelWidth(newWidth);
    },
    [isResizing]
  );

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  const togglePdfPanel = useCallback(() => {
    setIsPdfCollapsed((prev) => !prev);
  }, []);

  // Mobile: tabbed layout (PDF tab | Canvas tab)
  if (isMobile) {
    return (
      <main className="flex flex-col h-[95vh] bg-white overflow-hidden">
        <div className="flex shrink-0 border-b border-gray-200 bg-gray-50">
          <button
            type="button"
            onClick={() => setMobileTab("pdf")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
              mobileTab === "pdf"
                ? "bg-white text-blue-600 border-b-2 border-blue-600 -mb-px"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <FiFileText size={18} />
            PDF
          </button>
          <button
            type="button"
            onClick={() => setMobileTab("canvas")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
              mobileTab === "canvas"
                ? "bg-white text-blue-600 border-b-2 border-blue-600 -mb-px"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <FiGrid size={18} />
            Canvas
          </button>
        </div>
        <div className="flex-1 min-h-0 relative">
          {mobileTab === "pdf" && (
            <div className="absolute inset-0 overflow-auto">
              <PdfViewer />
            </div>
          )}
          {mobileTab === "canvas" && (
            <div className="absolute inset-0">
              <TldrawCanvas />
            </div>
          )}
        </div>
      </main>
    );
  }

  // Desktop: side-by-side layout with resize
  return (
    <main
      className="flex h-screen bg-white overflow-hidden"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* PDF Panel */}
      <div
        className={`shrink-0 border-r border-gray-200 transition-all duration-300 ${
          isPdfCollapsed ? "w-0 overflow-hidden" : ""
        }`}
        style={{ width: isPdfCollapsed ? 0 : pdfPanelWidth }}
      >
        <PdfViewer />
      </div>

      {/* Resize Handle */}
      {!isPdfCollapsed && (
        <div
          className={`w-1 bg-gray-200 hover:bg-blue-400 cursor-col-resize shrink-0 transition-colors ${
            isResizing ? "bg-blue-500" : ""
          }`}
          onMouseDown={handleMouseDown}
        />
      )}

      {/* Canvas Panel */}
      <div className="flex-1 relative min-h-0">
        <button
          onClick={togglePdfPanel}
          className="absolute top-4 left-4 z-10 p-2 bg-white rounded-lg shadow-md border border-gray-200 hover:bg-gray-50 transition-colors"
          title={isPdfCollapsed ? "Show PDF Panel" : "Hide PDF Panel"}
        >
          {isPdfCollapsed ? (
            <FiMaximize2 size={18} className="text-gray-600" />
          ) : (
            <FiMinimize2 size={18} className="text-gray-600" />
          )}
        </button>

        <TldrawCanvas />
      </div>
    </main>
  );
}
