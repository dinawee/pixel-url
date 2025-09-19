// Internal types for library implementation
export interface PDFDocument {
  numPages: number;
  fingerprint: string;
  destroy(): void;
  getPage(pageNumber: number): Promise<PDFPage>;
}

export interface PDFPage {
  getViewport(params: { scale: number }): PDFViewport;
  render(params: RenderParams): RenderTask;
}

export interface PDFViewport {
  width: number;
  height: number;
  scale: number;
  transform: number[];
}

export interface RenderParams {
  canvasContext: CanvasRenderingContext2D;
  viewport: PDFViewport;
}

export interface RenderTask {
  promise: Promise<void>;
}

export interface UsePDFDocumentReturn {
  document: PDFDocument | null;
  isLoading: boolean;
  error: string | null;
  pageCount: number;
  loadDocument: (source: File | string) => Promise<void>;
  clearDocument: () => void;
}

export interface UsePDFDocumentProps {
  file?: File;
  url?: string;
}
