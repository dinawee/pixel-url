import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SelectionCanvas } from './SelectionCanvas';

// Mock canvas context
const mockContext = {
  strokeRect: vi.fn(),
  fillRect: vi.fn(),
  clearRect: vi.fn(),
  save: vi.fn(),
  restore: vi.fn(),
  setLineDash: vi.fn(),
  beginPath: vi.fn(),
  rect: vi.fn(),
  stroke: vi.fn(),
};

// Mock HTMLCanvasElement
beforeEach(() => {
  vi.clearAllMocks();

  // Mock canvas getContext
  HTMLCanvasElement.prototype.getContext = vi.fn(() => mockContext);

  // Mock canvas dimensions
  Object.defineProperty(HTMLCanvasElement.prototype, 'offsetWidth', {
    writable: true,
    value: 800,
  });
  Object.defineProperty(HTMLCanvasElement.prototype, 'offsetHeight', {
    writable: true,
    value: 600,
  });
});

describe('SelectionCanvas', () => {
  describe('Canvas Initialization', () => {
    it('should render canvas element with correct attributes', () => {
      render(<SelectionCanvas width={800} height={600} isActive={false} />);

      const canvas = screen.getByTestId('selection-canvas');
      expect(canvas).toBeInTheDocument();
      expect(canvas).toHaveAttribute('width', '800');
      expect(canvas).toHaveAttribute('height', '600');
    });

    it('should position canvas as overlay', () => {
      render(<SelectionCanvas width={800} height={600} isActive={false} />);

      const canvas = screen.getByTestId('selection-canvas');
      expect(canvas).toHaveStyle({
        position: 'absolute',
        top: '0',
        left: '0',
        pointerEvents: 'none',
      });
    });

    it('should enable pointer events when active', () => {
      render(<SelectionCanvas width={800} height={600} isActive={true} />);

      const canvas = screen.getByTestId('selection-canvas');
      expect(canvas).toHaveStyle({
        pointerEvents: 'auto',
      });
    });
  });

  describe('Mouse Event Handling', () => {
    it('should call onSelectionStart on mouse down when active', () => {
      const onSelectionStart = vi.fn();

      render(
        <SelectionCanvas
          width={800}
          height={600}
          isActive={true}
          onSelectionStart={onSelectionStart}
        />
      );

      const canvas = screen.getByTestId('selection-canvas');
      fireEvent.mouseDown(canvas, { clientX: 10, clientY: 20 });

      expect(onSelectionStart).toHaveBeenCalledWith({
        x: 10,
        y: 20,
      });
    });

    it('should not handle mouse events when inactive', () => {
      const onSelectionStart = vi.fn();

      render(
        <SelectionCanvas
          width={800}
          height={600}
          isActive={false}
          onSelectionStart={onSelectionStart}
        />
      );

      const canvas = screen.getByTestId('selection-canvas');
      fireEvent.mouseDown(canvas, { clientX: 10, clientY: 20 });

      expect(onSelectionStart).not.toHaveBeenCalled();
    });

    it('should track mouse movement during selection', () => {
      const onSelectionUpdate = vi.fn();

      render(
        <SelectionCanvas
          width={800}
          height={600}
          isActive={true}
          onSelectionUpdate={onSelectionUpdate}
        />
      );

      const canvas = screen.getByTestId('selection-canvas');

      // Start selection
      fireEvent.mouseDown(canvas, { clientX: 10, clientY: 20 });

      // Move mouse
      fireEvent.mouseMove(canvas, { clientX: 50, clientY: 60 });

      expect(onSelectionUpdate).toHaveBeenCalledWith({
        startX: 10,
        startY: 20,
        currentX: 50,
        currentY: 60,
        width: 40,
        height: 40,
      });
    });

    it('should complete selection on mouse up', () => {
      const onSelectionComplete = vi.fn();

      render(
        <SelectionCanvas
          width={800}
          height={600}
          isActive={true}
          onSelectionComplete={onSelectionComplete}
        />
      );

      const canvas = screen.getByTestId('selection-canvas');

      // Complete selection workflow
      fireEvent.mouseDown(canvas, { clientX: 10, clientY: 20 });
      fireEvent.mouseMove(canvas, { clientX: 50, clientY: 60 });
      fireEvent.mouseUp(canvas);

      expect(onSelectionComplete).toHaveBeenCalledWith({
        x: 10,
        y: 20,
        width: 40,
        height: 40,
      });
    });
  });

  describe('Selection Rendering', () => {
    it('should clear canvas before drawing', () => {
      render(<SelectionCanvas width={800} height={600} isActive={true} />);

      const canvas = screen.getByTestId('selection-canvas');
      fireEvent.mouseDown(canvas, { clientX: 10, clientY: 20 });
      fireEvent.mouseMove(canvas, { clientX: 50, clientY: 60 });

      expect(mockContext.clearRect).toHaveBeenCalledWith(0, 0, 800, 600);
    });

    it('should draw selection rectangle with correct styles', () => {
      render(<SelectionCanvas width={800} height={600} isActive={true} selectionColor="#0066cc" />);

      const canvas = screen.getByTestId('selection-canvas');
      fireEvent.mouseDown(canvas, { clientX: 10, clientY: 20 });
      fireEvent.mouseMove(canvas, { clientX: 50, clientY: 60 });

      // Verify rectangle drawing
      expect(mockContext.strokeRect).toHaveBeenCalledWith(10, 20, 40, 40);
    });

    it('should handle negative selection (drag up/left)', () => {
      const onSelectionUpdate = vi.fn();

      render(
        <SelectionCanvas
          width={800}
          height={600}
          isActive={true}
          onSelectionUpdate={onSelectionUpdate}
        />
      );

      const canvas = screen.getByTestId('selection-canvas');

      // Drag from bottom-right to top-left
      fireEvent.mouseDown(canvas, { clientX: 50, clientY: 60 });
      fireEvent.mouseMove(canvas, { clientX: 10, clientY: 20 });

      expect(onSelectionUpdate).toHaveBeenCalledWith({
        startX: 50,
        startY: 60,
        currentX: 10,
        currentY: 20,
        width: -40,
        height: -40,
      });
    });
  });

  describe('Canvas Cleanup', () => {
    it('should remove event listeners on unmount', () => {
      const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');

      const { unmount } = render(<SelectionCanvas width={800} height={600} isActive={true} />);

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('mousemove', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('mouseup', expect.any(Function));
    });
  });
});
