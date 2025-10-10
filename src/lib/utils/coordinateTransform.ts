export interface Point {
  x: number;
  y: number;
}

export interface PDFCoordinates {
  x: number;
  y: number;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
  pageNumber: number;
  scale: number;
}

export interface NormalizedSelection extends BoundingBox {
  normalized: true;
}

export interface PDFViewport {
  width: number;
  height: number;
  scale: number;
  transform: number[];
  offsetX?: number;
  offsetY?: number;
}

/**
 * Convert screen coordinates to PDF document coordinates
 */
export const screenToPDF = (screenCoords: Point, viewport: PDFViewport): PDFCoordinates => {
  if (viewport.scale <= 0) {
    throw new Error('Invalid scale: scale must be greater than 0');
  }

  const offsetX = viewport.offsetX || 0;
  const offsetY = viewport.offsetY || 0;

  return {
    x: (screenCoords.x - offsetX) / viewport.scale,
    y: (screenCoords.y - offsetY) / viewport.scale,
  };
};

/**
 * Convert PDF document coordinates to screen coordinates
 */
export const pdfToScreen = (pdfCoords: PDFCoordinates, viewport: PDFViewport): Point => {
  const offsetX = viewport.offsetX || 0;
  const offsetY = viewport.offsetY || 0;

  return {
    x: pdfCoords.x * viewport.scale + offsetX,
    y: pdfCoords.y * viewport.scale + offsetY,
  };
};

/**
 * Normalize selection bounds to handle negative width/height
 */
export const normalizeSelection = (selection: BoundingBox): NormalizedSelection => {
  let { x, y, width, height } = selection;

  // Handle negative width (drag left)
  if (width < 0) {
    x = x + width;
    width = Math.abs(width);
  }

  // Handle negative height (drag up)
  if (height < 0) {
    y = y + height;
    height = Math.abs(height);
  }

  return {
    x,
    y,
    width,
    height,
    pageNumber: selection.pageNumber,
    scale: selection.scale,
    normalized: true,
  };
};

/**
 * Transform bounds to a different scale
 */
export const transformBounds = (bounds: BoundingBox, newScale: number): BoundingBox => {
  const scaleRatio = newScale / bounds.scale;

  return {
    x: bounds.x * scaleRatio,
    y: bounds.y * scaleRatio,
    width: bounds.width * scaleRatio,
    height: bounds.height * scaleRatio,
    pageNumber: bounds.pageNumber,
    scale: newScale,
  };
};

/**
 * Create transformation matrix from viewport
 */
export const createTransformMatrix = (viewport: PDFViewport): number[] => {
  const offsetX = viewport.offsetX || 0;
  const offsetY = viewport.offsetY || 0;

  return [
    viewport.scale, // a: horizontal scaling
    0, // b: horizontal skewing
    0, // c: vertical skewing
    viewport.scale, // d: vertical scaling
    offsetX, // e: horizontal translation
    offsetY, // f: vertical translation
  ];
};

/**
 * Apply transformation matrix to a point
 */
export const applyTransform = (point: Point, matrix: number[]): Point => {
  const [a, b, c, d, e, f] = matrix;

  return {
    x: a * point.x + c * point.y + e,
    y: b * point.x + d * point.y + f,
  };
};

/**
 * Get bounding box that encompasses the selection in PDF coordinates
 */
export const getSelectionBounds = (
  startPoint: Point,
  endPoint: Point,
  viewport: PDFViewport,
  pageNumber: number = 1
): NormalizedSelection => {
  // Convert screen coordinates to PDF coordinates
  const startPDF = screenToPDF(startPoint, viewport);
  const endPDF = screenToPDF(endPoint, viewport);

  // Create bounding box
  const bounds: BoundingBox = {
    x: startPDF.x,
    y: startPDF.y,
    width: endPDF.x - startPDF.x,
    height: endPDF.y - startPDF.y,
    pageNumber,
    scale: viewport.scale,
  };

  // Normalize to handle negative dimensions
  return normalizeSelection(bounds);
};

/**
 * Check if a point is within the viewport bounds
 */
export const isPointInViewport = (point: Point, viewport: PDFViewport): boolean => {
  return point.x >= 0 && point.y >= 0 && point.x <= viewport.width && point.y <= viewport.height;
};

/**
 * Clamp selection to viewport bounds
 */
export const clampToViewport = (selection: BoundingBox, viewport: PDFViewport): BoundingBox => {
  const maxX = viewport.width;
  const maxY = viewport.height;

  return {
    ...selection,
    x: Math.max(0, Math.min(selection.x, maxX - selection.width)),
    y: Math.max(0, Math.min(selection.y, maxY - selection.height)),
    width: Math.min(selection.width, maxX - selection.x),
    height: Math.min(selection.height, maxY - selection.y),
  };
};
