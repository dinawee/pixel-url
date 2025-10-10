import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  extractSelectionFromCanvas,
  findPDFCanvas,
  extractSelectionImage,
} from './imageExtraction';
import type { NormalizedSelection } from './coordinateTransform';

// Mock canvas and context
const mockCanvas = document.createElement('canvas');
const mockContext = {
  drawImage: vi.fn(),
  getImageData: vi.fn(),
  putImageData: vi.fn(),
};

// Mock canvas methods
beforeEach(() => {
  vi.clearAllMocks();

  // Mock canvas dimensions
  Object.defineProperty(mockCanvas, 'width', { value: 800, writable: true });
  Object.defineProperty(mockCanvas, 'height', { value: 600, writable: true });

  // Mock getContext
  HTMLCanvasElement.prototype.getContext = vi.fn(() => mockContext);

  // Mock toDataURL
  HTMLCanvasElement.prototype.toDataURL = vi.fn(() => 'data:image/png;base64,mock-extracted-image');

  // Mock createElement
  const originalCreateElement = document.createElement;
  document.createElement = vi.fn(tagName => {
    if (tagName === 'canvas') {
      const canvas = originalCreateElement.call(document, 'canvas');
      // Set canvas dimensions
      Object.defineProperty(canvas, 'width', { value: 0, writable: true });
      Object.defineProperty(canvas, 'height', { value: 0, writable: true });
      canvas.getContext = vi.fn(() => mockContext);
      canvas.toDataURL = vi.fn(() => 'data:image/png;base64,mock-extracted-image');
      return canvas;
    }
    return originalCreateElement.call(document, tagName);
  });
});

describe('imageExtraction', () => {
  describe('extractSelectionFromCanvas', () => {
    it('should extract selection from canvas with correct coordinates', () => {
      const selection: NormalizedSelection = {
        x: 100,
        y: 150,
        width: 200,
        height: 100,
        pageNumber: 1,
        scale: 1,
        normalized: true,
      };

      const result = extractSelectionFromCanvas(mockCanvas, selection, 1);

      expect(result).toBe('data:image/png;base64,mock-extracted-image');
      expect(mockContext.drawImage).toHaveBeenCalledWith(
        mockCanvas,
        100,
        150,
        200,
        100, // Source rectangle
        0,
        0,
        200,
        100 // Destination rectangle
      );
    });

    it('should handle scaled selections correctly', () => {
      const selection: NormalizedSelection = {
        x: 50,
        y: 75,
        width: 100,
        height: 50,
        pageNumber: 1,
        scale: 1,
        normalized: true,
      };

      const scale = 2;
      extractSelectionFromCanvas(mockCanvas, selection, scale);

      expect(mockContext.drawImage).toHaveBeenCalledWith(
        mockCanvas,
        100,
        150,
        200,
        100, // Scaled coordinates: 50*2, 75*2, 100*2, 50*2
        0,
        0,
        200,
        100
      );
    });

    it('should clamp selection to canvas bounds', () => {
      const selection: NormalizedSelection = {
        x: 700, // Near right edge
        y: 500, // Near bottom edge
        width: 200, // Would exceed canvas width
        height: 200, // Would exceed canvas height
        pageNumber: 1,
        scale: 1,
        normalized: true,
      };

      extractSelectionFromCanvas(mockCanvas, selection, 1);

      expect(mockContext.drawImage).toHaveBeenCalledWith(
        mockCanvas,
        700,
        500,
        100,
        100, // Clamped to canvas bounds
        0,
        0,
        100,
        100
      );
    });

    it('should handle selections outside canvas bounds', () => {
      const selection: NormalizedSelection = {
        x: 900, // Outside canvas
        y: 700, // Outside canvas
        width: 100,
        height: 100,
        pageNumber: 1,
        scale: 1,
        normalized: true,
      };

      const result = extractSelectionFromCanvas(mockCanvas, selection, 1);

      expect(result).toBeNull();
      expect(mockContext.drawImage).not.toHaveBeenCalled();
    });

    it('should handle negative dimensions', () => {
      const selection: NormalizedSelection = {
        x: 100,
        y: 150,
        width: -50, // Negative width
        height: -25, // Negative height
        pageNumber: 1,
        scale: 1,
        normalized: true,
      };

      extractSelectionFromCanvas(mockCanvas, selection, 1);

      // Should use absolute values
      expect(mockContext.drawImage).toHaveBeenCalledWith(
        mockCanvas,
        100,
        150,
        50,
        25, // Absolute values
        0,
        0,
        50,
        25
      );
    });

    it('should return null when canvas context is not available', () => {
      // Create a special canvas with null context for this test
      const nullContextCanvas = document.createElement('canvas');
      nullContextCanvas.getContext = vi.fn(() => null);

      const selection: NormalizedSelection = {
        x: 100,
        y: 150,
        width: 200,
        height: 100,
        pageNumber: 1,
        scale: 1,
        normalized: true,
      };

      const result = extractSelectionFromCanvas(nullContextCanvas, selection, 1);

      expect(result).toBeNull();
    });
  });

  describe('findPDFCanvas', () => {
    it('should find PDF canvas by excluding selection canvas', () => {
      const container = document.createElement('div');

      // Create selection canvas (should be ignored)
      const selectionCanvas = document.createElement('canvas');
      selectionCanvas.setAttribute('data-testid', 'selection-canvas');

      // Create PDF canvas (should be found)
      const pdfCanvas = document.createElement('canvas');
      pdfCanvas.setAttribute('data-testid', 'pdf-canvas');

      container.appendChild(selectionCanvas);
      container.appendChild(pdfCanvas);

      const result = findPDFCanvas(container);

      expect(result).toBe(pdfCanvas);
    });

    it('should return first canvas when no selection canvas exists', () => {
      const container = document.createElement('div');

      const canvas1 = document.createElement('canvas');
      const canvas2 = document.createElement('canvas');

      container.appendChild(canvas1);
      container.appendChild(canvas2);

      const result = findPDFCanvas(container);

      expect(result).toBe(canvas1);
    });

    it('should return null when no canvas is found', () => {
      const container = document.createElement('div');

      const result = findPDFCanvas(container);

      expect(result).toBeNull();
    });

    it('should handle container with only selection canvas', () => {
      const container = document.createElement('div');

      const selectionCanvas = document.createElement('canvas');
      selectionCanvas.setAttribute('data-testid', 'selection-canvas');
      container.appendChild(selectionCanvas);

      const result = findPDFCanvas(container);

      expect(result).toBe(selectionCanvas); // Should fallback to first canvas
    });
  });

  describe('extractSelectionImage', () => {
    it('should extract selection image from container', () => {
      const container = document.createElement('div');
      const pdfCanvas = document.createElement('canvas');

      // Set canvas dimensions for this test
      Object.defineProperty(pdfCanvas, 'width', { value: 800, writable: true });
      Object.defineProperty(pdfCanvas, 'height', { value: 600, writable: true });

      container.appendChild(pdfCanvas);

      const selection: NormalizedSelection = {
        x: 100,
        y: 150,
        width: 200,
        height: 100,
        pageNumber: 1,
        scale: 1.5,
        normalized: true,
      };

      const result = extractSelectionImage(container, selection);

      expect(result).toBe('data:image/png;base64,mock-extracted-image');
    });

    it('should return null when no canvas is found in container', () => {
      const container = document.createElement('div');

      const selection: NormalizedSelection = {
        x: 100,
        y: 150,
        width: 200,
        height: 100,
        pageNumber: 1,
        scale: 1,
        normalized: true,
      };

      const result = extractSelectionImage(container, selection);

      expect(result).toBeNull();
    });

    it('should use selection scale for extraction', () => {
      const container = document.createElement('div');
      const pdfCanvas = document.createElement('canvas');

      // Set canvas dimensions for this test
      Object.defineProperty(pdfCanvas, 'width', { value: 800, writable: true });
      Object.defineProperty(pdfCanvas, 'height', { value: 600, writable: true });

      container.appendChild(pdfCanvas);

      const selection: NormalizedSelection = {
        x: 50,
        y: 75,
        width: 100,
        height: 50,
        pageNumber: 1,
        scale: 2,
        normalized: true,
      };

      extractSelectionImage(container, selection);

      expect(mockContext.drawImage).toHaveBeenCalledWith(
        pdfCanvas,
        100,
        150,
        200,
        100, // Should use scale from selection: 50*2, 75*2, 100*2, 50*2
        0,
        0,
        200,
        100
      );
    });
  });
});
