"use client";

import { useState, useCallback, useEffect } from "react";
import {
  FiChevronLeft,
  FiChevronRight,
  FiZoomIn,
  FiZoomOut,
} from "react-icons/fi";

interface PdfControlsProps {
  currentPage: number;
  numPages: number;
  scale: number;
  onPreviousPage: () => void;
  onNextPage: () => void;
  onGoToPage: (page: number) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
}

export function PdfControls({
  currentPage,
  numPages,
  scale,
  onPreviousPage,
  onNextPage,
  onGoToPage,
  onZoomIn,
  onZoomOut,
  onResetZoom,
}: PdfControlsProps) {
  const [pageInput, setPageInput] = useState(currentPage.toString());

  // Sync page input with current page
  useEffect(() => {
    setPageInput(currentPage.toString());
  }, [currentPage]);

  const handlePageInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setPageInput(e.target.value);
    },
    []
  );

  const handlePageInputBlur = useCallback(() => {
    const page = parseInt(pageInput, 10);
    if (!isNaN(page) && page >= 1 && page <= numPages) {
      onGoToPage(page);
    } else {
      setPageInput(currentPage.toString());
    }
  }, [pageInput, numPages, currentPage, onGoToPage]);

  const handlePageInputKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        handlePageInputBlur();
      }
    },
    [handlePageInputBlur]
  );

  return (
    <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-gray-200">
      {/* Page Navigation */}
      <div className="flex items-center gap-2">
        <button
          onClick={onPreviousPage}
          disabled={currentPage <= 1}
          className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          title="Previous page"
        >
          <FiChevronLeft size={20} className="text-gray-600" />
        </button>

        <div className="flex items-center gap-1.5 text-sm">
          <input
            type="text"
            value={pageInput}
            onChange={handlePageInputChange}
            onBlur={handlePageInputBlur}
            onKeyDown={handlePageInputKeyDown}
            className="w-12 px-2 py-1 text-center border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <span className="text-gray-500">of {numPages}</span>
        </div>

        <button
          onClick={onNextPage}
          disabled={currentPage >= numPages}
          className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          title="Next page"
        >
          <FiChevronRight size={20} className="text-gray-600" />
        </button>
      </div>

      {/* Zoom Controls */}
      <div className="flex items-center gap-1">
        <button
          onClick={onZoomOut}
          disabled={scale <= 0.5}
          className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          title="Zoom out"
        >
          <FiZoomOut size={18} className="text-gray-600" />
        </button>

        <button
          onClick={onResetZoom}
          className="px-2 py-1 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-100 transition-colors min-w-15"
          title="Reset zoom"
        >
          {Math.round(scale * 100)}%
        </button>

        <button
          onClick={onZoomIn}
          disabled={scale >= 3}
          className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          title="Zoom in"
        >
          <FiZoomIn size={18} className="text-gray-600" />
        </button>
      </div>
    </div>
  );
}
