import { useRef, useEffect, useState } from 'react';
import { PDFViewer } from '../PDFViewer';
import { SelectionCanvas } from '../SelectionOverlay';
import { useCanvasSelection } from '../../hooks/useCanvasSelection';
import type { PDFViewport, NormalizedSelection } from '../../utils/coordinateTransform';
import type { PDFDocument } from '../../types/internal';

export interface PDFViewerWithSelectionProps {
  document?: PDFDocument | null;
  pageNumber?: number;
  scale?: number;
  isLoading?: boolean;
  error?: string | null;
  isSelectionActive?: boolean;
  onSelectionComplete?: (selection: NormalizedSelection) => void;
  onSelectionStart?: () => void;
  onSelectionCancel?: () => void;
  selectionColor?: string;
  className?: string;
  style?: React.CSSProperties;
}

export function PDFViewerWithSelection({
  document,
  pageNumber = 1,
  scale = 1,
  isLoading = false,
  error = null,
  isSelectionActive = false,
  onSelectionComplete,
  onSelectionStart,
  onSelectionCancel,
  selectionColor = '#0066cc',
  className,
  style,
}: PDFViewerWithSelectionProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewport, setViewport] = useState<PDFViewport | null>(null);
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 0, height: 0 });

  // Create viewport from PDF document and scale
  useEffect(() => {
    if (!document) {
      setViewport(null);
      return;
    }

    const createViewport = async () => {
      try {
        const page = await document.getPage(pageNumber);
        const pdfViewport = page.getViewport({ scale });

        const viewport: PDFViewport = {
          width: pdfViewport.width,
          height: pdfViewport.height,
          scale,
          transform: pdfViewport.transform,
          offsetX: 0,
          offsetY: 0,
        };

        setViewport(viewport);
        setCanvasDimensions({
          width: Math.floor(pdfViewport.width),
          height: Math.floor(pdfViewport.height),
        });
      } catch (err) {
        console.error('Failed to create viewport:', err);
        setViewport(null);
      }
    };

    createViewport();
  }, [document, pageNumber, scale]);

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
      {/* PDF Viewer Component */}
      <PDFViewer
        document={document}
        pageNumber={pageNumber}
        scale={scale}
        isLoading={isLoading}
        error={error}
      />

      {/* Selection Canvas Overlay */}
      {viewport && !isLoading && !error && isSelectionActive && (
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
