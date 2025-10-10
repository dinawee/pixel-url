// Main library export file - what gets published to npm
export { PDFSelectionTool } from './components/PDFSelectionTool';
export { PDFViewer } from './components/PDFViewer';
export { PDFPageNavigation } from './components/PDFPageNavigation';
export { PDFZoomControls } from './components/PDFZoomControls';
export { PDFViewerWithSelection } from './components/PDFViewerWithSelection';
export { SelectionCanvas } from './components/SelectionOverlay';
export { usePDFDocument } from './hooks/usePDFDocument';
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
export type { PDFSelectionToolProps, SelectionResult, SelectionCoordinates } from './types';
export type { PDFDocument, UsePDFDocumentReturn } from './types/internal';
export type { ScrollPosition, UseScrollPanReturn } from './hooks/useScrollPan';
export type { PDFViewerWithSelectionProps } from './components/PDFViewerWithSelection';
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
