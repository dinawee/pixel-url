// TypeScript types for react-pdf integration

export interface ReactPDFDocumentResult {
  file: File | string | null;
  isLoading: boolean;
  error: string | null;
  pageCount: number;
  loadDocument: (source: File | string) => Promise<void>;
  clearDocument: () => void;
  handleDocumentLoadSuccess: (result: { numPages: number }) => void;
  handleDocumentLoadError: (error: Error) => void;
}

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

export interface ReactPDFViewerWithSelectionProps {
  file?: File | string | null;
  pageNumber?: number;
  scale?: number;
  isLoading?: boolean;
  error?: string | null;
  isSelectionActive?: boolean;
  onSelectionComplete?: (selection: unknown) => void;
  onSelectionStart?: () => void;
  onSelectionCancel?: () => void;
  onDocumentLoadSuccess?: (result: { numPages: number }) => void;
  onDocumentLoadError?: (error: Error) => void;
  selectionColor?: string;
  className?: string;
  style?: React.CSSProperties;
}
