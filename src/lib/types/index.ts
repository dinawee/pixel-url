// Public API types
export interface PDFSelectionToolProps {
  pdfFile?: File;
  pdfUrl?: string;
  onSelectionComplete: (selection: SelectionResult) => void;
  onError?: (error: Error) => void;
  className?: string;
  style?: React.CSSProperties;
}

export interface SelectionResult {
  dataUrl: string;
  coordinates: SelectionCoordinates;
  metadata: {
    pageNumber: number;
    scale: number;
    timestamp: number;
  };
}

export interface SelectionCoordinates {
  x: number;
  y: number;
  width: number;
  height: number;
  pageNumber: number;
  scale: number;
}
