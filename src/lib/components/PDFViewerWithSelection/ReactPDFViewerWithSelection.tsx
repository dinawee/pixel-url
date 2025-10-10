import { useRef, useEffect, useState } from 'react';
import { Document } from 'react-pdf';
import { ReactPDFViewer } from '../PDFViewer/ReactPDFViewer';
import type { ReactPDFViewerRef } from '../PDFViewer/ReactPDFViewer';
import { SelectionCanvas } from '../SelectionOverlay';
import { useCanvasSelection } from '../../hooks/useCanvasSelection';
import type { PDFViewport, NormalizedSelection } from '../../utils/coordinateTransform';
import '../../config/react-pdf-setup';

export interface ReactPDFViewerWithSelectionProps {
  file?: File | string | null;
  pageNumber?: number;
  scale?: number;
  isLoading?: boolean;
  error?: string | null;
  isSelectionActive?: boolean;
  onSelectionComplete?: (selection: NormalizedSelection) => void;
  onSelectionStart?: () => void;
  onSelectionCancel?: () => void;
  onDocumentLoadSuccess?: (result: { numPages: number }) => void;
  onDocumentLoadError?: (error: Error) => void;
  selectionColor?: string;
  className?: string;
  style?: React.CSSProperties;
}

export function ReactPDFViewerWithSelection({
  file,
  pageNumber = 1,
  scale = 1,
  isLoading = false,
  error = null,
  isSelectionActive = false,
  onSelectionComplete,
  onSelectionStart,
  onSelectionCancel,
  onDocumentLoadSuccess,
  onDocumentLoadError,
  selectionColor = '#0066cc',
  className,
  style,
}: ReactPDFViewerWithSelectionProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<ReactPDFViewerRef>(null);
  const [viewport, setViewport] = useState<PDFViewport | null>(null);
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 0, height: 0 });
  const [pageLoaded, setPageLoaded] = useState(false);

  // Create viewport when page renders successfully
  const handlePageRenderSuccess = () => {
    setPageLoaded(true);

    // Get canvas to determine dimensions
    const canvas = viewerRef.current?.getCanvas();
    if (canvas) {
      const viewport: PDFViewport = {
        width: canvas.width,
        height: canvas.height,
        scale,
        transform: [scale, 0, 0, scale, 0, 0], // Simple transform for react-pdf
        offsetX: 0,
        offsetY: 0,
      };

      setViewport(viewport);
      setCanvasDimensions({
        width: canvas.width,
        height: canvas.height,
      });
    }
  };

  const handlePageRenderError = (error: Error) => {
    console.error('Page render error:', error);
    setPageLoaded(false);
    setViewport(null);
  };

  // Reset state when file changes
  useEffect(() => {
    setPageLoaded(false);
    setViewport(null);
    setCanvasDimensions({ width: 0, height: 0 });
  }, [file, pageNumber, scale]);

  // Selection logic using our custom hook
  const selection = useCanvasSelection({
    viewport: viewport || {
      width: 800,
      height: 600,
      scale: 1,
      transform: [1, 0, 0, 1, 0, 0],
      offsetX: 0,
      offsetY: 0,
    },
    pageNumber,
    onSelectionStart,
    onSelectionComplete,
    onSelectionCancel,
    minSelectionSize: 10,
  });

  const handleSelectionStart = (coords: { x: number; y: number }) => {
    selection.startSelection(coords);
  };

  const handleSelectionUpdate = (selectionData: {
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
    width: number;
    height: number;
  }) => {
    selection.updateSelection({ x: selectionData.currentX, y: selectionData.currentY });
  };

  const handleSelectionComplete = () => {
    selection.completeSelection();
  };

  // Don't render Document wrapper if no file
  if (!file) {
    return (
      <div className={className} style={style}>
        <ReactPDFViewer
          file={file}
          pageNumber={pageNumber}
          scale={scale}
          isLoading={isLoading}
          error={error}
          ref={viewerRef}
        />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        position: 'relative',
        display: 'inline-block',
        ...style,
      }}
    >
      {/* react-pdf Document wrapper */}
      <Document
        file={file}
        onLoadSuccess={onDocumentLoadSuccess}
        onLoadError={onDocumentLoadError}
        loading={<div>Loading PDF...</div>}
        error={<div>Error loading PDF</div>}
      >
        {/* PDF Viewer Component with Page */}
        <ReactPDFViewer
          file={file}
          pageNumber={pageNumber}
          scale={scale}
          isLoading={isLoading}
          error={error}
          ref={viewerRef}
          onRenderSuccess={handlePageRenderSuccess}
          onRenderError={handlePageRenderError}
        />
      </Document>

      {/* Selection Canvas Overlay */}
      {viewport && pageLoaded && !isLoading && !error && isSelectionActive && (
        <SelectionCanvas
          width={canvasDimensions.width}
          height={canvasDimensions.height}
          isActive={isSelectionActive}
          onSelectionStart={handleSelectionStart}
          onSelectionUpdate={handleSelectionUpdate}
          onSelectionComplete={handleSelectionComplete}
          selectionColor={selectionColor}
        />
      )}

      {/* Selection Controls */}
      {isSelectionActive && (
        <div
          style={{
            position: 'absolute',
            top: 10,
            right: 10,
            background: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            padding: '8px 12px',
            borderRadius: '4px',
            fontSize: '12px',
            zIndex: 1000,
          }}
        >
          {selection.isSelecting ? (
            <button
              onClick={selection.cancelSelection}
              style={{
                background: 'transparent',
                border: '1px solid white',
                color: 'white',
                padding: '4px 8px',
                borderRadius: '2px',
                cursor: 'pointer',
              }}
            >
              Cancel Selection
            </button>
          ) : (
            <span>Click and drag to select an area</span>
          )}
        </div>
      )}
    </div>
  );
}
