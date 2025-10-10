import { useRef, forwardRef, useImperativeHandle } from 'react';
import { Page } from 'react-pdf';
import '../../config/react-pdf-setup'; // Import worker setup

export interface ReactPDFViewerProps {
  file?: File | string | null;
  pageNumber?: number;
  scale?: number;
  isLoading?: boolean;
  error?: string | null;
  className?: string;
  style?: React.CSSProperties;
  onRenderSuccess?: () => void;
  onRenderError?: (error: Error) => void;
}

export interface ReactPDFViewerRef {
  getCanvas: () => HTMLCanvasElement | null;
}

export const ReactPDFViewer = forwardRef<ReactPDFViewerRef, ReactPDFViewerProps>(
  (
    {
      file,
      pageNumber = 1,
      scale = 1,
      isLoading = false,
      error = null,
      className,
      style,
      onRenderSuccess,
      onRenderError,
    },
    ref
  ) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Expose canvas access for selection overlay
    useImperativeHandle(ref, () => ({
      getCanvas: () => canvasRef.current,
    }));

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

    // Show empty state
    if (!file) {
      return (
        <div className={className} style={style}>
          No PDF document loaded
        </div>
      );
    }

    return (
      <div className={className} style={style}>
        <Page
          pageNumber={pageNumber}
          scale={scale}
          canvasRef={canvasRef}
          renderTextLayer={false}
          renderAnnotationLayer={false}
          onRenderSuccess={onRenderSuccess}
          onRenderError={onRenderError}
          loading={<div>Rendering page...</div>}
          error={<div>Error rendering page</div>}
        />
      </div>
    );
  }
);
