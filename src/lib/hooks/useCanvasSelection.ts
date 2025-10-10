import { useState, useCallback, useEffect } from 'react';
import { getSelectionBounds, screenToPDF } from '../utils/coordinateTransform';
import type { Point, PDFViewport, NormalizedSelection } from '../utils/coordinateTransform';

export interface UseCanvasSelectionProps {
  viewport: PDFViewport;
  pageNumber: number;
  onSelectionStart?: (point: Point) => void;
  onSelectionUpdate?: (selection: SelectionData) => void;
  onSelectionComplete?: (bounds: NormalizedSelection) => void;
  onSelectionCancel?: () => void;
  minSelectionSize?: number;
}

export interface SelectionData {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  width: number;
  height: number;
  pdfCoords?: {
    start: Point;
    current: Point;
  };
}

export interface UseCanvasSelectionReturn {
  isSelecting: boolean;
  currentSelection: SelectionData | null;
  selectionBounds: NormalizedSelection | null;
  startPoint: Point | null;
  endPoint: Point | null;
  startSelection: (point: Point) => void;
  updateSelection: (point: Point) => void;
  completeSelection: () => void;
  cancelSelection: () => void;
  clearSelection: () => void;
}

export const useCanvasSelection = ({
  viewport,
  pageNumber,
  onSelectionStart,
  onSelectionUpdate,
  onSelectionComplete,
  onSelectionCancel,
  minSelectionSize = 5,
}: UseCanvasSelectionProps): UseCanvasSelectionReturn => {
  const [isSelecting, setIsSelecting] = useState(false);
  const [startPoint, setStartPoint] = useState<Point | null>(null);
  const [endPoint, setEndPoint] = useState<Point | null>(null);
  const [selectionBounds, setSelectionBounds] = useState<NormalizedSelection | null>(null);

  // Clear selection state when page changes
  useEffect(() => {
    setIsSelecting(false);
    setStartPoint(null);
    setEndPoint(null);
    setSelectionBounds(null);
  }, [pageNumber]);

  // Compute current selection from start and end points
  const currentSelection =
    startPoint && endPoint
      ? {
          startX: startPoint.x,
          startY: startPoint.y,
          currentX: endPoint.x,
          currentY: endPoint.y,
          width: endPoint.x - startPoint.x,
          height: endPoint.y - startPoint.y,
          pdfCoords: {
            start: screenToPDF(startPoint, viewport),
            current: screenToPDF(endPoint, viewport),
          },
        }
      : null;

  const startSelection = useCallback(
    (point: Point) => {
      // Don't start if already selecting
      if (isSelecting) return;

      setIsSelecting(true);
      setStartPoint(point);
      setEndPoint(point); // Initialize endPoint to startPoint
      setSelectionBounds(null);

      onSelectionStart?.(point);
    },
    [isSelecting, onSelectionStart]
  );

  const updateSelection = useCallback(
    (point: Point) => {
      // Only update if currently selecting
      if (!isSelecting || !startPoint) return;

      setEndPoint(point);

      // Calculate current selection data
      const width = point.x - startPoint.x;
      const height = point.y - startPoint.y;

      const pdfStart = screenToPDF(startPoint, viewport);
      const pdfCurrent = screenToPDF(point, viewport);

      const selectionData: SelectionData = {
        startX: startPoint.x,
        startY: startPoint.y,
        currentX: point.x,
        currentY: point.y,
        width,
        height,
        pdfCoords: {
          start: pdfStart,
          current: pdfCurrent,
        },
      };

      onSelectionUpdate?.(selectionData);
    },
    [isSelecting, startPoint, viewport, onSelectionUpdate]
  );

  const completeSelection = useCallback(() => {
    // Only complete if currently selecting
    if (!isSelecting || !startPoint || !endPoint) return;

    // Check minimum selection size
    const width = Math.abs(endPoint.x - startPoint.x);
    const height = Math.abs(endPoint.y - startPoint.y);

    if (width < minSelectionSize || height < minSelectionSize) {
      // Selection too small, don't complete
      return;
    }

    // Calculate final selection bounds using coordinate transformation
    const bounds = getSelectionBounds(startPoint, endPoint, viewport, pageNumber);

    setIsSelecting(false);
    setSelectionBounds(bounds);

    onSelectionComplete?.(bounds);
  }, [
    isSelecting,
    startPoint,
    endPoint,
    viewport,
    pageNumber,
    minSelectionSize,
    onSelectionComplete,
  ]);

  const cancelSelection = useCallback(() => {
    setIsSelecting(false);
    setStartPoint(null);
    setEndPoint(null);
    setSelectionBounds(null);

    onSelectionCancel?.();
  }, [onSelectionCancel]);

  const clearSelection = useCallback(() => {
    setSelectionBounds(null);
    setStartPoint(null);
    setEndPoint(null);
    setIsSelecting(false);
  }, []);

  return {
    isSelecting,
    currentSelection,
    selectionBounds,
    startPoint,
    endPoint,
    startSelection,
    updateSelection,
    completeSelection,
    cancelSelection,
    clearSelection,
  };
};
