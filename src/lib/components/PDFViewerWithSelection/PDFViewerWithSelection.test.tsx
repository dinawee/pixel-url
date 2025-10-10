/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { PDFViewerWithSelection } from './PDFViewerWithSelection';
import { createMockPDFDocument, createMockPDFPage } from '../../test-helpers/mockFactories';

// Mock the child components
vi.mock('../PDFViewer', () => ({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  PDFViewer: vi.fn(({ document, pageNumber, scale }) => (
    <canvas
      data-testid="pdf-canvas"
      width={800}
      height={600}
      style={{ width: 800 * scale, height: 600 * scale }}
    />
  )),
}));

vi.mock('../SelectionOverlay', () => ({
  SelectionCanvas: vi.fn(
    ({ width, height, isActive, onSelectionStart, onSelectionUpdate, onSelectionComplete }) => (
      <canvas
        data-testid="selection-canvas"
        width={width}
        height={height}
        onMouseDown={e => isActive && onSelectionStart?.({ x: e.clientX, y: e.clientY })}
        onMouseMove={e =>
          isActive &&
          onSelectionUpdate?.({
            startX: 0,
            startY: 0,
            currentX: e.clientX,
            currentY: e.clientY,
            width: 100,
            height: 100,
          })
        }
        onMouseUp={() => isActive && onSelectionComplete?.({ x: 0, y: 0, width: 100, height: 100 })}
        style={{ position: 'absolute', top: 0, left: 0 }}
      />
    )
  ),
}));

vi.mock('../../hooks/useCanvasSelection', () => ({
  useCanvasSelection: vi.fn(props => ({
    isSelecting: false,
    currentSelection: null,
    selectionBounds: null,
    startPoint: null,
    endPoint: null,
    startSelection: vi.fn(coords => {
      // Call the onSelectionStart callback if provided
      props?.onSelectionStart?.(coords);
    }),
    updateSelection: vi.fn(),
    completeSelection: vi.fn(),
    cancelSelection: vi.fn(),
    clearSelection: vi.fn(),
  })),
}));

describe('PDFViewerWithSelection', () => {
  let mockDocument: any;
  let mockPage: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockPage = createMockPDFPage({
      viewport: { width: 800, height: 600, scale: 1, transform: [1, 0, 0, 1, 0, 0] },
    });

    mockDocument = createMockPDFDocument({
      numPages: 5,
      getPage: vi.fn().mockResolvedValue(mockPage),
    });
  });

  describe('Component Rendering', () => {
    it('should render PDF viewer without selection overlay when not active', async () => {
      await act(async () => {
        render(
          <PDFViewerWithSelection
            document={mockDocument}
            pageNumber={1}
            scale={1}
            isSelectionActive={false}
          />
        );
      });

      expect(screen.getByTestId('pdf-canvas')).toBeInTheDocument();
      expect(screen.queryByTestId('selection-canvas')).not.toBeInTheDocument();
    });

    it('should render both PDF viewer and selection overlay when active', async () => {
      render(
        <PDFViewerWithSelection
          document={mockDocument}
          pageNumber={1}
          scale={1}
          isSelectionActive={true}
        />
      );

      expect(screen.getByTestId('pdf-canvas')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByTestId('selection-canvas')).toBeInTheDocument();
      });
    });

    it('should not render selection overlay when loading', async () => {
      await act(async () => {
        render(
          <PDFViewerWithSelection
            document={mockDocument}
            pageNumber={1}
            scale={1}
            isLoading={true}
            isSelectionActive={true}
          />
        );
      });

      expect(screen.getByTestId('pdf-canvas')).toBeInTheDocument();
      expect(screen.queryByTestId('selection-canvas')).not.toBeInTheDocument();
    });

    it('should not render selection overlay when there is an error', async () => {
      await act(async () => {
        render(
          <PDFViewerWithSelection
            document={mockDocument}
            pageNumber={1}
            scale={1}
            error="Failed to load PDF"
            isSelectionActive={true}
          />
        );
      });

      expect(screen.getByTestId('pdf-canvas')).toBeInTheDocument();
      expect(screen.queryByTestId('selection-canvas')).not.toBeInTheDocument();
    });
  });

  describe('Selection Integration', () => {
    it('should integrate selection overlay with correct dimensions', async () => {
      const { SelectionCanvas } = await import('../SelectionOverlay');

      render(
        <PDFViewerWithSelection
          document={mockDocument}
          pageNumber={1}
          scale={1}
          isSelectionActive={true}
        />
      );

      await waitFor(() => {
        expect(SelectionCanvas).toHaveBeenCalledWith(
          expect.objectContaining({
            width: 800,
            height: 600,
            isActive: true,
            onSelectionStart: expect.any(Function),
            onSelectionUpdate: expect.any(Function),
            onSelectionComplete: expect.any(Function),
            selectionColor: '#0066cc',
          }),
          undefined // React functional components don't get a second parameter
        );
      });
    });

    it('should handle selection events correctly', async () => {
      const onSelectionComplete = vi.fn();
      const onSelectionStart = vi.fn();

      render(
        <PDFViewerWithSelection
          document={mockDocument}
          pageNumber={1}
          scale={1}
          isSelectionActive={true}
          onSelectionStart={onSelectionStart}
          onSelectionComplete={onSelectionComplete}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('selection-canvas')).toBeInTheDocument();
      });

      const selectionCanvas = screen.getByTestId('selection-canvas');

      // Simulate selection workflow
      await act(async () => {
        fireEvent.mouseDown(selectionCanvas, { clientX: 100, clientY: 200 });
        fireEvent.mouseMove(selectionCanvas, { clientX: 200, clientY: 300 });
        fireEvent.mouseUp(selectionCanvas);
      });

      // The onSelectionStart callback is triggered through the component's internal event handlers
      // We need to wait for the mock to be called
      await waitFor(() => {
        expect(onSelectionStart).toHaveBeenCalled();
      });
    });

    it('should scale selection overlay with PDF scale', async () => {
      const { SelectionCanvas } = await import('../SelectionOverlay');

      render(
        <PDFViewerWithSelection
          document={mockDocument}
          pageNumber={1}
          scale={2}
          isSelectionActive={true}
        />
      );

      await waitFor(() => {
        expect(SelectionCanvas).toHaveBeenCalledWith(
          expect.objectContaining({
            width: 1600, // 800 * 2
            height: 1200, // 600 * 2
            isActive: true,
            onSelectionStart: expect.any(Function),
            onSelectionUpdate: expect.any(Function),
            onSelectionComplete: expect.any(Function),
            selectionColor: '#0066cc',
          }),
          undefined // React functional components don't get a second parameter
        );
      });
    });
  });

  describe('Viewport Management', () => {
    it('should create correct viewport from PDF document', async () => {
      const { useCanvasSelection } = await import('../../hooks/useCanvasSelection');

      render(
        <PDFViewerWithSelection
          document={mockDocument}
          pageNumber={2}
          scale={1.5}
          isSelectionActive={true}
        />
      );

      // Wait for the PDF viewport to be created (after async getPage call)
      await waitFor(
        () => {
          expect(useCanvasSelection).toHaveBeenCalledWith(
            expect.objectContaining({
              viewport: expect.objectContaining({
                width: 1200, // 800 * 1.5
                height: 900, // 600 * 1.5
                scale: 1.5,
              }),
              pageNumber: 2,
              minSelectionSize: 10,
            })
          );
        },
        { timeout: 2000 }
      );
    });

    it('should handle viewport updates when scale changes', async () => {
      const { useCanvasSelection } = await import('../../hooks/useCanvasSelection');

      const { rerender } = render(
        <PDFViewerWithSelection
          document={mockDocument}
          pageNumber={1}
          scale={1}
          isSelectionActive={true}
        />
      );

      await waitFor(() => {
        expect(useCanvasSelection).toHaveBeenCalledWith(
          expect.objectContaining({
            viewport: expect.objectContaining({ scale: 1 }),
          })
        );
      });

      // Change scale
      rerender(
        <PDFViewerWithSelection
          document={mockDocument}
          pageNumber={1}
          scale={2}
          isSelectionActive={true}
        />
      );

      await waitFor(() => {
        expect(useCanvasSelection).toHaveBeenCalledWith(
          expect.objectContaining({
            viewport: expect.objectContaining({ scale: 2 }),
          })
        );
      });
    });
  });

  describe('Selection Controls UI', () => {
    it('should show selection controls when selection is active', async () => {
      render(
        <PDFViewerWithSelection
          document={mockDocument}
          pageNumber={1}
          scale={1}
          isSelectionActive={true}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Click and drag to select an area')).toBeInTheDocument();
      });
    });

    it('should not show selection controls when selection is inactive', async () => {
      await act(async () => {
        render(
          <PDFViewerWithSelection
            document={mockDocument}
            pageNumber={1}
            scale={1}
            isSelectionActive={false}
          />
        );
      });

      expect(screen.queryByText('Click and drag to select an area')).not.toBeInTheDocument();
    });

    it('should show cancel button when actively selecting', async () => {
      const mockUseCanvasSelection = await import('../../hooks/useCanvasSelection');

      // Mock the hook to return selecting state
      vi.mocked(mockUseCanvasSelection.useCanvasSelection).mockReturnValue({
        isSelecting: true,
        currentSelection: null,
        selectionBounds: null,
        startPoint: null,
        endPoint: null,
        startSelection: vi.fn(),
        updateSelection: vi.fn(),
        completeSelection: vi.fn(),
        cancelSelection: vi.fn(),
        clearSelection: vi.fn(),
      });

      render(
        <PDFViewerWithSelection
          document={mockDocument}
          pageNumber={1}
          scale={1}
          isSelectionActive={true}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Cancel Selection')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle missing document gracefully', () => {
      render(
        <PDFViewerWithSelection document={null} pageNumber={1} scale={1} isSelectionActive={true} />
      );

      expect(screen.getByTestId('pdf-canvas')).toBeInTheDocument();
      expect(screen.queryByTestId('selection-canvas')).not.toBeInTheDocument();
    });

    it('should handle PDF loading errors gracefully', () => {
      render(
        <PDFViewerWithSelection
          document={null}
          pageNumber={1}
          scale={1}
          error="Failed to load PDF"
          isSelectionActive={true}
        />
      );

      expect(screen.queryByTestId('selection-canvas')).not.toBeInTheDocument();
    });
  });
});
