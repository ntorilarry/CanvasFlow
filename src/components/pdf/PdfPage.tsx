"use client";

import { memo, useCallback } from "react";
import { Page } from "react-pdf";

interface PdfPageProps {
  pageNumber: number;
  scale: number;
  isVisible: boolean;
  registerRef: (pageNum: number, element: HTMLDivElement | null) => void;
}

export const PdfPage = memo(function PdfPage({
  pageNumber,
  scale,
  isVisible,
  registerRef,
}: PdfPageProps) {
  const setRef = useCallback(
    (element: HTMLDivElement | null) => {
      registerRef(pageNumber, element);
    },
    [pageNumber, registerRef]
  );

  return (
    <div
      ref={setRef}
      className="bg-white shadow-lg rounded-lg overflow-hidden"
      style={{ minHeight: isVisible ? "auto" : 800 * scale }}
    >
      {isVisible ? (
        <Page
          pageNumber={pageNumber}
          scale={scale}
          renderTextLayer={true}
          renderAnnotationLayer={true}
          loading={
            <div
              className="flex items-center justify-center bg-gray-50"
              style={{ width: 600 * scale, height: 800 * scale }}
            >
              <div className="animate-pulse text-gray-400">Loading...</div>
            </div>
          }
        />
      ) : (
        <div
          className="flex items-center justify-center bg-gray-50 text-gray-400"
          style={{ width: 600 * scale, height: 800 * scale }}
        >
          Page {pageNumber}
        </div>
      )}
      <div className="text-center py-2 text-sm text-gray-500 bg-gray-50 border-t border-gray-100">
        Page {pageNumber}
      </div>
    </div>
  );
});
