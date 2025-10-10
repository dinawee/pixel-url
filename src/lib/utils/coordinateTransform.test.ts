import { describe, it, expect } from 'vitest';
import {
  screenToPDF,
  pdfToScreen,
  normalizeSelection,
  transformBounds,
  createTransformMatrix,
} from './coordinateTransform';
import type { Point, PDFCoordinates, BoundingBox, PDFViewport } from './coordinateTransform';

// Mock viewport data
const createMockViewport = (options: Partial<PDFViewport> = {}): PDFViewport => ({
  width: 800,
  height: 600,
  scale: 1,
  transform: [1, 0, 0, 1, 0, 0],
  offsetX: 0,
  offsetY: 0,
  ...options,
});

describe('coordinateTransform', () => {
  describe('screenToPDF', () => {
    it('should convert screen coordinates to PDF coordinates at scale 1', () => {
      const viewport = createMockViewport({ scale: 1 });
      const screenCoords: Point = { x: 100, y: 200 };

      const result = screenToPDF(screenCoords, viewport);

      expect(result).toEqual({ x: 100, y: 200 });
    });

    it('should convert screen coordinates to PDF coordinates at scale 2', () => {
      const viewport = createMockViewport({ scale: 2 });
      const screenCoords: Point = { x: 100, y: 200 };

      const result = screenToPDF(screenCoords, viewport);

      expect(result).toEqual({ x: 50, y: 100 });
    });

    it('should handle fractional scales', () => {
      const viewport = createMockViewport({ scale: 1.5 });
      const screenCoords: Point = { x: 150, y: 300 };

      const result = screenToPDF(screenCoords, viewport);

      expect(result.x).toBeCloseTo(100);
      expect(result.y).toBeCloseTo(200);
    });

    it('should account for viewport offset', () => {
      const viewport = createMockViewport({
        scale: 1,
        offsetX: 50,
        offsetY: 30,
      });
      const screenCoords: Point = { x: 100, y: 200 };

      const result = screenToPDF(screenCoords, viewport);

      expect(result).toEqual({ x: 50, y: 170 });
    });

    it('should handle zero coordinates', () => {
      const viewport = createMockViewport({ scale: 2 });
      const screenCoords: Point = { x: 0, y: 0 };

      const result = screenToPDF(screenCoords, viewport);

      expect(result).toEqual({ x: 0, y: 0 });
    });
  });

  describe('pdfToScreen', () => {
    it('should convert PDF coordinates to screen coordinates at scale 1', () => {
      const viewport = createMockViewport({ scale: 1 });
      const pdfCoords: PDFCoordinates = { x: 100, y: 200 };

      const result = pdfToScreen(pdfCoords, viewport);

      expect(result).toEqual({ x: 100, y: 200 });
    });

    it('should convert PDF coordinates to screen coordinates at scale 2', () => {
      const viewport = createMockViewport({ scale: 2 });
      const pdfCoords: PDFCoordinates = { x: 50, y: 100 };

      const result = pdfToScreen(pdfCoords, viewport);

      expect(result).toEqual({ x: 100, y: 200 });
    });

    it('should be inverse of screenToPDF', () => {
      const viewport = createMockViewport({ scale: 1.5, offsetX: 25, offsetY: 15 });
      const originalScreen: Point = { x: 120, y: 180 };

      const pdfCoords = screenToPDF(originalScreen, viewport);
      const backToScreen = pdfToScreen(pdfCoords, viewport);

      expect(backToScreen.x).toBeCloseTo(originalScreen.x);
      expect(backToScreen.y).toBeCloseTo(originalScreen.y);
    });
  });

  describe('normalizeSelection', () => {
    it('should normalize positive selection', () => {
      const selection: BoundingBox = {
        x: 10,
        y: 20,
        width: 100,
        height: 80,
        pageNumber: 1,
        scale: 1.5,
      };

      const result = normalizeSelection(selection);

      expect(result).toEqual({
        x: 10,
        y: 20,
        width: 100,
        height: 80,
        pageNumber: 1,
        scale: 1.5,
        normalized: true,
      });
    });

    it('should normalize negative width selection', () => {
      const selection: BoundingBox = {
        x: 50,
        y: 20,
        width: -40,
        height: 80,
        pageNumber: 1,
        scale: 1,
      };

      const result = normalizeSelection(selection);

      expect(result).toEqual({
        x: 10,
        y: 20,
        width: 40,
        height: 80,
        pageNumber: 1,
        scale: 1,
        normalized: true,
      });
    });

    it('should normalize negative height selection', () => {
      const selection: BoundingBox = {
        x: 10,
        y: 60,
        width: 100,
        height: -40,
        pageNumber: 1,
        scale: 1,
      };

      const result = normalizeSelection(selection);

      expect(result).toEqual({
        x: 10,
        y: 20,
        width: 100,
        height: 40,
        pageNumber: 1,
        scale: 1,
        normalized: true,
      });
    });

    it('should normalize both negative dimensions', () => {
      const selection: BoundingBox = {
        x: 50,
        y: 60,
        width: -40,
        height: -40,
        pageNumber: 2,
        scale: 2,
      };

      const result = normalizeSelection(selection);

      expect(result).toEqual({
        x: 10,
        y: 20,
        width: 40,
        height: 40,
        pageNumber: 2,
        scale: 2,
        normalized: true,
      });
    });
  });

  describe('transformBounds', () => {
    it('should scale bounds correctly', () => {
      const bounds: BoundingBox = {
        x: 10,
        y: 20,
        width: 100,
        height: 80,
        pageNumber: 1,
        scale: 1,
      };

      const result = transformBounds(bounds, 2);

      expect(result).toEqual({
        x: 20,
        y: 40,
        width: 200,
        height: 160,
        pageNumber: 1,
        scale: 2,
      });
    });

    it('should handle fractional scales', () => {
      const bounds: BoundingBox = {
        x: 20,
        y: 40,
        width: 100,
        height: 60,
        pageNumber: 1,
        scale: 2,
      };

      const result = transformBounds(bounds, 0.5);

      expect(result).toEqual({
        x: 5,
        y: 10,
        width: 25,
        height: 15,
        pageNumber: 1,
        scale: 0.5,
      });
    });

    it('should preserve page number', () => {
      const bounds: BoundingBox = {
        x: 10,
        y: 20,
        width: 100,
        height: 80,
        pageNumber: 5,
        scale: 1,
      };

      const result = transformBounds(bounds, 3);

      expect(result.pageNumber).toBe(5);
    });
  });

  describe('createTransformMatrix', () => {
    it('should create identity matrix for scale 1', () => {
      const viewport = createMockViewport({ scale: 1 });

      const result = createTransformMatrix(viewport);

      expect(result).toEqual([1, 0, 0, 1, 0, 0]);
    });

    it('should create scale matrix', () => {
      const viewport = createMockViewport({ scale: 2 });

      const result = createTransformMatrix(viewport);

      expect(result).toEqual([2, 0, 0, 2, 0, 0]);
    });

    it('should include translation', () => {
      const viewport = createMockViewport({
        scale: 1,
        offsetX: 50,
        offsetY: 30,
      });

      const result = createTransformMatrix(viewport);

      expect(result).toEqual([1, 0, 0, 1, 50, 30]);
    });

    it('should combine scale and translation', () => {
      const viewport = createMockViewport({
        scale: 1.5,
        offsetX: 25,
        offsetY: 15,
      });

      const result = createTransformMatrix(viewport);

      expect(result).toEqual([1.5, 0, 0, 1.5, 25, 15]);
    });
  });

  describe('edge cases', () => {
    it('should handle zero scale gracefully', () => {
      const viewport = createMockViewport({ scale: 0 });
      const screenCoords: Point = { x: 100, y: 200 };

      // Should not divide by zero
      expect(() => screenToPDF(screenCoords, viewport)).toThrow('Invalid scale');
    });

    it('should handle negative coordinates', () => {
      const viewport = createMockViewport({ scale: 1 });
      const screenCoords: Point = { x: -50, y: -30 };

      const result = screenToPDF(screenCoords, viewport);

      expect(result).toEqual({ x: -50, y: -30 });
    });

    it('should handle very large coordinates', () => {
      const viewport = createMockViewport({ scale: 0.1 });
      const screenCoords: Point = { x: 10000, y: 8000 };

      const result = screenToPDF(screenCoords, viewport);

      expect(result).toEqual({ x: 100000, y: 80000 });
    });
  });
});
