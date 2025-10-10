import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCanvasSelection } from './useCanvasSelection';
import type { PDFViewport } from '../utils/coordinateTransform';

// Mock coordinate transform utilities
vi.mock('../utils/coordinateTransform', () => ({
  screenToPDF: vi.fn((coords, viewport) => ({
    x: coords.x / viewport.scale,
    y: coords.y / viewport.scale,
  })),
  getSelectionBounds: vi.fn((start, end, viewport, pageNumber) => {
    const x = Math.min(start.x, end.x) / viewport.scale;
    const y = Math.min(start.y, end.y) / viewport.scale;
    const width = Math.abs(end.x - start.x) / viewport.scale;
    const height = Math.abs(end.y - start.y) / viewport.scale;

    return {
      x,
      y,
      width,
      height,
      pageNumber,
      scale: viewport.scale,
      normalized: true,
    };
  }),
}));

const mockViewport: PDFViewport = {
  width: 800,
  height: 600,
  scale: 1,
  transform: [1, 0, 0, 1, 0, 0],
  offsetX: 0,
  offsetY: 0,
};

describe('useCanvasSelection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('should initialize with correct default state', () => {
      const { result } = renderHook(() =>
        useCanvasSelection({
          viewport: mockViewport,
          pageNumber: 1,
        })
      );

      expect(result.current.isSelecting).toBe(false);
      expect(result.current.currentSelection).toBeNull();
      expect(result.current.selectionBounds).toBeNull();
      expect(result.current.startPoint).toBeNull();
      expect(result.current.endPoint).toBeNull();
    });

    it('should provide selection control functions', () => {
      const { result } = renderHook(() =>
        useCanvasSelection({
          viewport: mockViewport,
          pageNumber: 1,
        })
      );

      expect(typeof result.current.startSelection).toBe('function');
      expect(typeof result.current.updateSelection).toBe('function');
      expect(typeof result.current.completeSelection).toBe('function');
      expect(typeof result.current.cancelSelection).toBe('function');
      expect(typeof result.current.clearSelection).toBe('function');
    });
  });

  describe('selection lifecycle', () => {
    it('should start selection correctly', () => {
      const onSelectionStart = vi.fn();
      const { result } = renderHook(() =>
        useCanvasSelection({
          viewport: mockViewport,
          pageNumber: 1,
          onSelectionStart,
        })
      );

      act(() => {
        result.current.startSelection({ x: 10, y: 20 });
      });

      expect(result.current.isSelecting).toBe(true);
      expect(result.current.startPoint).toEqual({ x: 10, y: 20 });
      expect(onSelectionStart).toHaveBeenCalledWith({ x: 10, y: 20 });
    });

    it('should update selection during drawing', () => {
      const onSelectionUpdate = vi.fn();
      const { result } = renderHook(() =>
        useCanvasSelection({
          viewport: mockViewport,
          pageNumber: 1,
          onSelectionUpdate,
        })
      );

      // Start selection
      act(() => {
        result.current.startSelection({ x: 10, y: 20 });
      });

      // Update selection
      act(() => {
        result.current.updateSelection({ x: 50, y: 60 });
      });

      expect(result.current.endPoint).toEqual({ x: 50, y: 60 });
      expect(result.current.currentSelection).toBeTruthy();
      expect(onSelectionUpdate).toHaveBeenCalled();
    });

    it('should complete selection correctly', () => {
      const onSelectionComplete = vi.fn();
      const { result } = renderHook(() =>
        useCanvasSelection({
          viewport: mockViewport,
          pageNumber: 1,
          onSelectionComplete,
          minSelectionSize: 5, // Make sure we meet minimum size
        })
      );

      // Start selection
      act(() => {
        result.current.startSelection({ x: 10, y: 20 });
      });

      // Update selection with sufficient size
      act(() => {
        result.current.updateSelection({ x: 50, y: 60 }); // 40x40 selection
      });

      // Debug: Check the current state before completing
      console.log('Before completion:');
      console.log('startPoint:', result.current.startPoint);
      console.log('endPoint:', result.current.endPoint);
      console.log('isSelecting:', result.current.isSelecting);

      act(() => {
        result.current.completeSelection();
      });

      console.log('After completion:');
      console.log('isSelecting:', result.current.isSelecting);
      console.log('selectionBounds:', result.current.selectionBounds);

      expect(result.current.isSelecting).toBe(false);
      expect(result.current.selectionBounds).toBeTruthy();
      expect(onSelectionComplete).toHaveBeenCalled();
    });

    it('should cancel selection correctly', () => {
      const onSelectionCancel = vi.fn();
      const { result } = renderHook(() =>
        useCanvasSelection({
          viewport: mockViewport,
          pageNumber: 1,
          onSelectionCancel,
        })
      );

      // Start selection
      act(() => {
        result.current.startSelection({ x: 10, y: 20 });
      });

      // Cancel selection
      act(() => {
        result.current.cancelSelection();
      });

      expect(result.current.isSelecting).toBe(false);
      expect(result.current.currentSelection).toBeNull();
      expect(result.current.startPoint).toBeNull();
      expect(result.current.endPoint).toBeNull();
      expect(onSelectionCancel).toHaveBeenCalled();
    });

    it('should clear completed selection', () => {
      const { result } = renderHook(() =>
        useCanvasSelection({
          viewport: mockViewport,
          pageNumber: 1,
          minSelectionSize: 5, // Make sure we meet minimum size
        })
      );

      // Complete a selection first
      act(() => {
        result.current.startSelection({ x: 10, y: 20 });
      });
      act(() => {
        result.current.updateSelection({ x: 50, y: 60 }); // 40x40 selection
      });
      act(() => {
        result.current.completeSelection();
      });

      expect(result.current.selectionBounds).toBeTruthy();

      // Clear selection
      act(() => {
        result.current.clearSelection();
      });

      expect(result.current.selectionBounds).toBeNull();
      expect(result.current.currentSelection).toBeNull();
    });
  });

  describe('coordinate transformation', () => {
    it('should use coordinate transformation for selection bounds', () => {
      const { result } = renderHook(() =>
        useCanvasSelection({
          viewport: mockViewport,
          pageNumber: 2,
          minSelectionSize: 5,
        })
      );

      act(() => {
        result.current.startSelection({ x: 100, y: 200 });
      });
      act(() => {
        result.current.updateSelection({ x: 150, y: 250 });
      });
      act(() => {
        result.current.completeSelection();
      });

      // Verify that the selection was completed and bounds were calculated
      expect(result.current.selectionBounds).toBeTruthy();
      expect(result.current.selectionBounds?.pageNumber).toBe(2);
    });

    it('should handle viewport scale changes', () => {
      const scaledViewport: PDFViewport = {
        ...mockViewport,
        scale: 2,
      };

      const { result, rerender } = renderHook(
        ({ viewport }) => useCanvasSelection({ viewport, pageNumber: 1 }),
        { initialProps: { viewport: mockViewport } }
      );

      // Start selection
      act(() => {
        result.current.startSelection({ x: 100, y: 200 });
        result.current.updateSelection({ x: 150, y: 250 });
      });

      // Change viewport scale
      rerender({ viewport: scaledViewport });

      // Selection should still work with new scale
      act(() => {
        result.current.updateSelection({ x: 200, y: 300 });
      });

      expect(result.current.currentSelection).toBeTruthy();
    });
  });

  describe('selection validation', () => {
    it('should not start selection if already selecting', () => {
      const onSelectionStart = vi.fn();
      const { result } = renderHook(() =>
        useCanvasSelection({
          viewport: mockViewport,
          pageNumber: 1,
          onSelectionStart,
        })
      );

      // Start first selection
      act(() => {
        result.current.startSelection({ x: 10, y: 20 });
      });

      // Try to start another selection
      act(() => {
        result.current.startSelection({ x: 50, y: 60 });
      });

      expect(onSelectionStart).toHaveBeenCalledTimes(1);
      expect(result.current.startPoint).toEqual({ x: 10, y: 20 });
    });

    it('should not update selection if not selecting', () => {
      const onSelectionUpdate = vi.fn();
      const { result } = renderHook(() =>
        useCanvasSelection({
          viewport: mockViewport,
          pageNumber: 1,
          onSelectionUpdate,
        })
      );

      act(() => {
        result.current.updateSelection({ x: 50, y: 60 });
      });

      expect(onSelectionUpdate).not.toHaveBeenCalled();
      expect(result.current.endPoint).toBeNull();
    });

    it('should not complete selection if not selecting', () => {
      const onSelectionComplete = vi.fn();
      const { result } = renderHook(() =>
        useCanvasSelection({
          viewport: mockViewport,
          pageNumber: 1,
          onSelectionComplete,
        })
      );

      act(() => {
        result.current.completeSelection();
      });

      expect(onSelectionComplete).not.toHaveBeenCalled();
    });

    it('should require minimum selection size', () => {
      const onSelectionComplete = vi.fn();
      const { result } = renderHook(() =>
        useCanvasSelection({
          viewport: mockViewport,
          pageNumber: 1,
          onSelectionComplete,
          minSelectionSize: 10,
        })
      );

      // Create a selection too small
      act(() => {
        result.current.startSelection({ x: 10, y: 20 });
        result.current.updateSelection({ x: 15, y: 25 }); // 5x5 selection
        result.current.completeSelection();
      });

      expect(onSelectionComplete).not.toHaveBeenCalled();
      expect(result.current.isSelecting).toBe(true); // Should still be selecting
    });
  });

  describe('selection state management', () => {
    it('should maintain selection state correctly throughout lifecycle', () => {
      const { result } = renderHook(() =>
        useCanvasSelection({
          viewport: mockViewport,
          pageNumber: 1,
        })
      );

      // Initial state
      expect(result.current.isSelecting).toBe(false);

      // Start selection
      act(() => {
        result.current.startSelection({ x: 10, y: 20 });
      });
      expect(result.current.isSelecting).toBe(true);

      // Update selection
      act(() => {
        result.current.updateSelection({ x: 50, y: 60 });
      });
      expect(result.current.isSelecting).toBe(true);

      // Complete selection
      act(() => {
        result.current.completeSelection();
      });
      expect(result.current.isSelecting).toBe(false);
      expect(result.current.selectionBounds).toBeTruthy();
    });

    it('should provide current selection dimensions', () => {
      const { result } = renderHook(() =>
        useCanvasSelection({
          viewport: mockViewport,
          pageNumber: 1,
        })
      );

      act(() => {
        result.current.startSelection({ x: 10, y: 20 });
      });

      act(() => {
        result.current.updateSelection({ x: 50, y: 60 });
      });

      const selection = result.current.currentSelection;
      expect(selection).toBeTruthy();
      expect(selection?.width).toBe(40);
      expect(selection?.height).toBe(40);
    });
  });
});
