import { useState, useCallback, useRef, useEffect } from 'react';
import { ReactPDFViewerWithSelection } from '../PDFViewerWithSelection/ReactPDFViewerWithSelection';
import { PDFPageNavigation } from '../PDFPageNavigation/PDFPageNavigation';
import { PDFZoomControls } from '../PDFZoomControls/PDFZoomControls';
import { useReactPDFDocument } from '../../hooks/useReactPDFDocument';
import { useScrollPan } from '../../hooks/useScrollPan';
import { extractSelectionImage } from '../../utils/imageExtraction';
import type { NormalizedSelection } from '../../utils/coordinateTransform';

/**
 * Props for the PixelUrl component - a simple PDF viewer with selection capabilities
 */
export interface PixelUrlProps {
  file?: File | string | null;
  onSelectionComplete?: (result: {
    image: string | null;
    coordinates: NormalizedSelection;
  }) => void;
  onSelectionStart?: () => void;
  onSelectionCancel?: () => void;
  isSelectionActive?: boolean;
  selectionColor?: string;
  showNavigation?: boolean;
  showZoomControls?: boolean;
  enablePanning?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export function PixelUrl({
  file: externalFile,
  onSelectionComplete,
  onSelectionStart,
  onSelectionCancel,
  isSelectionActive = false,
  selectionColor = '#0066cc',
  showNavigation = true,
  showZoomControls = true,
  enablePanning = true,
  className,
  style,
}: PixelUrlProps) {
  // Document management
  const {
    file,
    isLoading,
    error,
    pageCount,
    loadDocument,
    clearDocument,
    handleDocumentLoadSuccess,
    handleDocumentLoadError,
  } = useReactPDFDocument();

  // Internal state for page and zoom
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollToRef = useRef<((x: number, y: number) => void) | null>(null);

  // Load external file when provided or clear when null
  useEffect(() => {
    if (externalFile && externalFile !== file) {
      setCurrentPage(1);
      setScale(1);
      loadDocument(externalFile);
    } else if (!externalFile && file) {
      // Clear document when external file becomes null
      clearDocument();
      setCurrentPage(1);
      setScale(1);
    }
  }, [externalFile, file, loadDocument, clearDocument]);

  // Page boundary handling for scroll/pan
  const handlePageBoundary = useCallback(
    (direction: 'next' | 'prev') => {
      if (direction === 'next' && currentPage < pageCount) {
        setCurrentPage(currentPage + 1);
        setTimeout(() => {
          scrollToRef.current?.(0, 0);
        }, 50);
      } else if (direction === 'prev' && currentPage > 1) {
        setCurrentPage(currentPage - 1);
        setTimeout(() => {
          if (containerRef.current && scrollToRef.current) {
            const maxScrollTop =
              containerRef.current.scrollHeight - containerRef.current.clientHeight;
            scrollToRef.current(0, maxScrollTop);
          }
        }, 50);
      }
    },
    [currentPage, pageCount]
  );

  // Scroll/pan functionality
  const { isPanning, scrollPosition, attachContainer, scrollTo, centerContent } = useScrollPan(
    handlePageBoundary,
    { disabled: !enablePanning || isSelectionActive }
  );

  // Store scrollTo function in ref
  useEffect(() => {
    scrollToRef.current = scrollTo;
  }, [scrollTo]);

  // Attach container to scroll/pan hook
  useEffect(() => {
    if (enablePanning) {
      attachContainer(containerRef.current);
    }
  }, [attachContainer, enablePanning]);

  // Center content when zoomed
  useEffect(() => {
    if (file && scale !== 1) {
      const timer = setTimeout(() => {
        centerContent();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [scale, centerContent, file]);

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Handle scale change
  const handleScaleChange = useCallback((newScale: number | 'fit-width') => {
    if (newScale === 'fit-width') {
      setScale(1.2);
    } else {
      setScale(newScale);
    }
  }, []);

  // Enhanced selection complete handler with automatic image extraction
  const handleSelectionCompleteInternal = useCallback(
    (selection: NormalizedSelection) => {
      let extractedImage: string | null = null;

      // Auto-extract image from selection
      if (containerRef.current) {
        try {
          extractedImage = extractSelectionImage(containerRef.current, selection);
        } catch (error) {
          console.warn('Failed to extract image from selection:', error);
        }
      }

      // Call user callback with both image and coordinates
      onSelectionComplete?.({
        image: extractedImage,
        coordinates: selection,
      });
    },
    [onSelectionComplete]
  );

  return (
    <div className={className} style={style}>
      {/* Controls */}
      {file && (showNavigation || showZoomControls) && (
        <div
          style={{
            marginBottom: '15px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '10px',
          }}
        >
          {showZoomControls && (
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <PDFZoomControls
                scale={scale}
                hasDocument={!!file}
                onScaleChange={handleScaleChange}
              />
            </div>
          )}
          {showNavigation && pageCount > 1 && (
            <PDFPageNavigation
              currentPage={currentPage}
              totalPages={pageCount}
              onPageChange={handlePageChange}
            />
          )}
        </div>
      )}

      {/* Scroll info for debugging (can be removed later) */}
      {file && enablePanning && (
        <div
          style={{
            marginBottom: '10px',
            textAlign: 'center',
            fontSize: '12px',
            color: '#666',
            fontFamily: 'monospace',
          }}
        >
          Scroll: ({Math.round(scrollPosition.x)}, {Math.round(scrollPosition.y)})
          {isPanning && ' • Panning...'}
          <br />
          <span style={{ fontSize: '10px' }}>
            Click and drag to pan • Mouse wheel/arrows cross pages • Keyboard: ↑↓←→ PgUp PgDn Home
            End
          </span>
        </div>
      )}

      {/* PDF Viewer Container */}
      <div
        ref={containerRef}
        style={{
          border: '1px solid #ccc',
          borderRadius: '8px',
          overflow: isSelectionActive ? 'hidden' : 'auto',
          width: file ? '800px' : 'auto',
          height: file ? '600px' : 'auto',
          margin: '0 auto',
          padding: file ? '0' : '10px',
          cursor: isPanning ? 'grabbing' : file ? 'grab' : 'default',
          userSelect: 'none',
        }}
      >
        <ReactPDFViewerWithSelection
          file={file}
          isLoading={isLoading}
          error={error}
          scale={scale}
          pageNumber={currentPage}
          isSelectionActive={isSelectionActive}
          onSelectionStart={onSelectionStart}
          onSelectionComplete={handleSelectionCompleteInternal}
          onSelectionCancel={onSelectionCancel}
          onDocumentLoadSuccess={handleDocumentLoadSuccess}
          onDocumentLoadError={handleDocumentLoadError}
          selectionColor={selectionColor}
        />
      </div>
    </div>
  );
}
