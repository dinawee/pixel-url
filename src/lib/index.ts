// Main library export file - what gets published to npm
export { PDFSelectionTool } from './components/PDFSelectionTool';
export { PDFViewer } from './components/PDFViewer';
export { PDFPageNavigation } from './components/PDFPageNavigation';
export { usePDFDocument } from './hooks/usePDFDocument';
export type { PDFSelectionToolProps, SelectionResult, SelectionCoordinates } from './types';
export type { PDFDocument, UsePDFDocumentReturn } from './types/internal';
