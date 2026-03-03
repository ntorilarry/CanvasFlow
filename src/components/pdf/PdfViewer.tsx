"use client";

import { useState, useCallback, useRef } from "react";
import { Document, pdfjs } from "react-pdf";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";
import { PdfPage } from "./PdfPage";
import { PdfControls } from "./PdfControls";
import {
  FiUpload,
  FiFile,
} from "react-icons/fi";


pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PdfViewerProps {
  className?: string;
}

export function PdfViewer({ className }: PdfViewerProps) {
  const [pdfFile, setPdfFile] = useState<string | File | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [scale, setScale] = useState<number>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  // Virtualization: determine which pages to render
  const [visiblePages, setVisiblePages] = useState<number[]>([1]);

  const onDocumentLoadSuccess = useCallback(
    ({ numPages }: { numPages: number }) => {
      setNumPages(numPages);
      setCurrentPage(1);
      setIsLoading(false);
      setError(null);
      // Initialize visible pages
      setVisiblePages([1, 2, 3].filter((p) => p <= numPages));
    },
    []
  );

  const onDocumentLoadError = useCallback((error: Error) => {
    console.error("PDF load error:", error);
    setError("Failed to load PDF. Please try another file.");
    setIsLoading(false);
  }, []);

  // Handle file upload
  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file && file.type === "application/pdf") {
        setIsLoading(true);
        setError(null);
        setPdfFile(file);
      }
    },
    []
  );

  // Handle scroll to update visible pages (virtualization)
  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current || numPages === 0) return;

    const container = scrollContainerRef.current;
    const containerRect = container.getBoundingClientRect();
    const containerHeight = containerRect.height;

    // Find which pages are visible
    const newVisiblePages: number[] = [];

    pageRefs.current.forEach((element, pageNum) => {
      const rect = element.getBoundingClientRect();
      const relativeTop = rect.top - containerRect.top;
      const relativeBottom = rect.bottom - containerRect.top;

      // Page is visible if it overlaps with the container
      if (relativeBottom > 0 && relativeTop < containerHeight) {
        newVisiblePages.push(pageNum);
      }
    });

    // Sort and add buffer pages
    newVisiblePages.sort((a, b) => a - b);

    if (newVisiblePages.length > 0) {
      const firstVisible = newVisiblePages[0];
      const lastVisible = newVisiblePages[newVisiblePages.length - 1];

      // Add buffer pages (1 before and 1 after)
      const bufferedPages = new Set<number>();
      for (
        let i = Math.max(1, firstVisible - 1);
        i <= Math.min(numPages, lastVisible + 1);
        i++
      ) {
        bufferedPages.add(i);
      }

      setVisiblePages(Array.from(bufferedPages).sort((a, b) => a - b));

      // Update current page based on center of viewport
      const centerY = containerHeight / 2;
      let closestPage = firstVisible;
      let closestDistance = Infinity;

      pageRefs.current.forEach((element, pageNum) => {
        const rect = element.getBoundingClientRect();
        const pageCenterY =
          rect.top - containerRect.top + rect.height / 2;
        const distance = Math.abs(pageCenterY - centerY);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestPage = pageNum;
        }
      });

      if (closestPage !== currentPage) {
        setCurrentPage(closestPage);
      }
    }
  }, [numPages, currentPage]);

  // Scroll to page
  const scrollToPage = useCallback((pageNum: number) => {
    const element = pageRefs.current.get(pageNum);
    if (element && scrollContainerRef.current) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  // Navigation handlers
  const goToPreviousPage = useCallback(() => {
    if (currentPage > 1) {
      const newPage = currentPage - 1;
      setCurrentPage(newPage);
      scrollToPage(newPage);
    }
  }, [currentPage, scrollToPage]);

  const goToNextPage = useCallback(() => {
    if (currentPage < numPages) {
      const newPage = currentPage + 1;
      setCurrentPage(newPage);
      scrollToPage(newPage);
    }
  }, [currentPage, numPages, scrollToPage]);

  const goToPage = useCallback(
    (pageNum: number) => {
      const page = Math.max(1, Math.min(numPages, pageNum));
      setCurrentPage(page);
      scrollToPage(page);
    },
    [numPages, scrollToPage]
  );

  // Zoom handlers
  const zoomIn = useCallback(() => {
    setScale((s) => Math.min(3, s + 0.25));
  }, []);

  const zoomOut = useCallback(() => {
    setScale((s) => Math.max(0.5, s - 0.25));
  }, []);

  const resetZoom = useCallback(() => {
    setScale(1);
  }, []);

  // Register page ref
  const registerPageRef = useCallback(
    (pageNum: number, element: HTMLDivElement | null) => {
      if (element) {
        pageRefs.current.set(pageNum, element);
      } else {
        pageRefs.current.delete(pageNum);
      }
    },
    []
  );



  return (
    <div
      ref={containerRef}
      className={`flex flex-col h-full bg-gray-100 ${className || ""}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
        <div className="flex items-center gap-3">
          <FiFile className="text-gray-500" size={20} />
          <span className="text-sm font-medium text-gray-700">
            {pdfFile instanceof File ? pdfFile.name : "PDF Viewer"}
          </span>
        </div>
        <label className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 cursor-pointer transition-colors">
          <FiUpload size={16} />
          Upload
          <input
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>
      </div>

      {/* Controls */}
      {numPages > 0 && (
        <PdfControls
          currentPage={currentPage}
          numPages={numPages}
          scale={scale}
          onPreviousPage={goToPreviousPage}
          onNextPage={goToNextPage}
          onGoToPage={goToPage}
          onZoomIn={zoomIn}
          onZoomOut={zoomOut}
          onResetZoom={resetZoom}
        />
      )}

      {/* PDF Content */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-auto p-4"
      >
        {!pdfFile && !isLoading && (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <FiUpload size={48} className="mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">No PDF loaded</p>
            <p className="text-sm">Upload a PDF to get started</p>
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center justify-center h-full text-red-500">
            <p className="text-lg font-medium mb-2">Error</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {pdfFile && (
          <Document
            file={pdfFile}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading={
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
              </div>
            }
          >
            <div className="flex flex-col items-center gap-4">
              {Array.from({ length: numPages }, (_, i) => i + 1).map(
                (pageNum) => (
                  <PdfPage
                    key={pageNum}
                    pageNumber={pageNum}
                    scale={scale}
                    isVisible={visiblePages.includes(pageNum)}
                    registerRef={registerPageRef}
                  />
                )
              )}
            </div>
          </Document>
        )}
      </div>
    </div>
  );
}
