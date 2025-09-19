// Main library export file - what gets published to npm
export { PDFSelectionTool } from './components/PDFSelectionTool';
export { PDFViewer } from './components/PDFViewer';
export { PDFPageNavigation } from './components/PDFPageNavigation';
export { PDFZoomControls } from './components/PDFZoomControls';
export { usePDFDocument } from './hooks/usePDFDocument';
export { useScrollPan } from './hooks/useScrollPan';
export type { PDFSelectionToolProps, SelectionResult, SelectionCoordinates } from './types';
export type { PDFDocument, UsePDFDocumentReturn } from './types/internal';
export type { ScrollPosition, UseScrollPanReturn } from './hooks/useScrollPan';
