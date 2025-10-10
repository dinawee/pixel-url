// Main library export file - what gets published to npm

// Simplified API - Main export
export { PixelUrl } from './components/PixelUrl';

// Advanced/Individual components (for power users)
export { PDFSelectionTool } from './components/PDFSelectionTool';
export { ReactPDFViewer } from './components/PDFViewer';
export { PDFPageNavigation } from './components/PDFPageNavigation';
export { PDFZoomControls } from './components/PDFZoomControls';
export { ReactPDFViewerWithSelection } from './components/PDFViewerWithSelection';
export { SelectionCanvas } from './components/SelectionOverlay';
export { useReactPDFDocument } from './hooks/useReactPDFDocument';
export { useScrollPan } from './hooks/useScrollPan';
export { useCanvasSelection } from './hooks/useCanvasSelection';

// Coordinate transformation utilities
export {
  screenToPDF,
  pdfToScreen,
  normalizeSelection,
  transformBounds,
  getSelectionBounds,
  createTransformMatrix,
  applyTransform,
  isPointInViewport,
  clampToViewport,
} from './utils/coordinateTransform';

// Image extraction utilities
export {
  extractSelectionFromCanvas,
  findPDFCanvas,
  extractSelectionImage,
} from './utils/imageExtraction';

// Types

// Simplified API types
export type { PixelUrlProps } from './components/PixelUrl';

// Advanced/Individual component types
export type { PDFSelectionToolProps, SelectionResult, SelectionCoordinates } from './types';
export type {
  ReactPDFDocumentResult,
  ReactPDFViewerProps,
  ReactPDFViewerRef,
  ReactPDFViewerWithSelectionProps,
} from './types/react-pdf';
export type { ScrollPosition, UseScrollPanReturn } from './hooks/useScrollPan';
export type {
  UseCanvasSelectionProps,
  UseCanvasSelectionReturn,
  SelectionData,
} from './hooks/useCanvasSelection';
export type {
  Point,
  PDFCoordinates,
  BoundingBox,
  NormalizedSelection,
  PDFViewport,
} from './utils/coordinateTransform';
