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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderTaskRef = useRef<any>(null);

  useEffect(() => {
    if (!document || !canvasRef.current) {
      return;
    }

    const renderPage = async () => {
      try {
        // Cancel any previous render operation
        if (renderTaskRef.current) {
          renderTaskRef.current.cancel();
          renderTaskRef.current = null;
        }

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

        // Store the render task so we can cancel it if needed
        renderTaskRef.current = renderTask;

        await renderTask.promise;

        // Clear the render task reference on successful completion
        renderTaskRef.current = null;
      } catch (err) {
        // Check if the error is due to cancellation
        if (err instanceof Error && err.name === 'RenderingCancelledException') {
          // Ignore cancellation errors - they're expected
          return;
        }

        const errorMessage = err instanceof Error ? err.message : 'Unknown rendering error';
        setRenderError(errorMessage);
        renderTaskRef.current = null;
      } finally {
        setIsRendering(false);
      }
    };

    renderPage();

    // Cleanup function to cancel render task if component unmounts
    return () => {
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
        renderTaskRef.current = null;
      }
    };
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
          margin: '0 auto', // Centers horizontally, allows full scroll when overflowing
        }}
      />
      {isRendering && <div>Rendering page...</div>}
    </div>
  );
}
