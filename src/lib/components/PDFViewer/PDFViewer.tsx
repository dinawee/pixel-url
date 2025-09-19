import { useEffect, useRef, useState } from 'react';
import type { PDFDocument, PDFPage, PDFViewport } from '../../types/internal';

export interface PDFViewerProps {
  document?: PDFDocument | null;
  pageNumber?: number;
  scale?: number;
  isLoading?: boolean;
  error?: string | null;
  className?: string;
  style?: React.CSSProperties;
}

export function PDFViewer({
  document,
  pageNumber = 1,
  scale = 1,
  isLoading = false,
  error = null,
  className,
  style,
}: PDFViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [isRendering, setIsRendering] = useState(false);

  useEffect(() => {
    if (!document || !canvasRef.current) {
      return;
    }

    const renderPage = async () => {
      try {
        setRenderError(null);
        setIsRendering(true);

        // Validate page number
        if (pageNumber < 1 || pageNumber > document.numPages) {
          throw new Error(
            `Invalid page number: ${pageNumber}. Document has ${document.numPages} pages.`
          );
        }

        const page: PDFPage = await document.getPage(pageNumber);

        // Get viewport with scale
        const viewport: PDFViewport = page.getViewport({ scale });

        // Set canvas dimensions
        const canvas = canvasRef.current!;
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        // Get canvas context
        const context = canvas.getContext('2d');
        if (!context) {
          throw new Error('Failed to get canvas 2D context');
        }

        // Render the page
        const renderTask = page.render({
          canvasContext: context,
          viewport,
        });

        await renderTask.promise;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown rendering error';
        setRenderError(errorMessage);
      } finally {
        setIsRendering(false);
      }
    };

    renderPage();
  }, [document, pageNumber, scale]);

  // Show loading state
  if (isLoading) {
    return (
      <div className={className} style={style}>
        Loading PDF...
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className={className} style={style}>
        Error: {error}
      </div>
    );
  }

  // Show render error
  if (renderError) {
    return (
      <div className={className} style={style}>
        Error rendering page: {renderError}
      </div>
    );
  }

  // Show empty state
  if (!document) {
    return (
      <div className={className} style={style}>
        No PDF document loaded
      </div>
    );
  }

  return (
    <div className={className} style={style}>
      <canvas
        ref={canvasRef}
        role="canvas"
        style={{
          display: 'block',
          margin: '0 auto' // Centers horizontally, allows full scroll when overflowing
        }}
      />
      {isRendering && <div>Rendering page...</div>}
    </div>
  );
}
