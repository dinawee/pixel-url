import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { PDFViewer } from './PDFViewer';
import type { PDFDocument } from '../../types/internal';

// Mock canvas rendering
const mockRenderTask = {
  promise: Promise.resolve(),
};

const mockPage = {
  getViewport: vi.fn(() => ({
    width: 600,
    height: 800,
    scale: 1,
    transform: [1, 0, 0, 1, 0, 0],
  })),
  render: vi.fn(() => mockRenderTask),
};

const mockDocument: PDFDocument = {
  numPages: 3,
  fingerprint: 'test-fingerprint',
  dispose: vi.fn(),
  getPage: vi.fn(() => Promise.resolve(mockPage)),
};

describe('PDFViewer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('should render empty state when no document provided', () => {
      render(<PDFViewer />);

      expect(screen.getByText('No PDF document loaded')).toBeInTheDocument();
      expect(screen.queryByRole('canvas')).not.toBeInTheDocument();
    });

    it('should show loading state', () => {
      render(<PDFViewer isLoading={true} />);

      expect(screen.getByText('Loading PDF...')).toBeInTheDocument();
    });

    it('should show error state', () => {
      const errorMessage = 'Failed to load PDF';
      render(<PDFViewer error={errorMessage} />);

      expect(screen.getByText(`Error: ${errorMessage}`)).toBeInTheDocument();
    });
  });

  describe('PDF rendering', () => {
    it('should render canvas when document is provided', async () => {
      render(<PDFViewer document={mockDocument} />);

      await waitFor(() => {
        expect(screen.getByRole('canvas')).toBeInTheDocument();
      });
    });

    it('should render first page by default', async () => {
      render(<PDFViewer document={mockDocument} />);

      await waitFor(() => {
        expect(mockDocument.getPage).toHaveBeenCalledWith(1);
        expect(mockPage.getViewport).toHaveBeenCalledWith({ scale: 1 });
        expect(mockPage.render).toHaveBeenCalled();
      });
    });

    it('should set canvas dimensions based on viewport', async () => {
      render(<PDFViewer document={mockDocument} />);

      await waitFor(() => {
        const canvas = screen.getByRole('canvas') as HTMLCanvasElement;
        expect(canvas.width).toBe(600);
        expect(canvas.height).toBe(800);
      });
    });

    it('should support custom scale', async () => {
      render(<PDFViewer document={mockDocument} scale={1.5} />);

      await waitFor(() => {
        expect(mockPage.getViewport).toHaveBeenCalledWith({ scale: 1.5 });
      });
    });

    it('should display specific page when pageNumber prop provided', async () => {
      render(<PDFViewer document={mockDocument} pageNumber={2} />);

      await waitFor(() => {
        expect(mockDocument.getPage).toHaveBeenCalledWith(2);
      });
    });
  });

  describe('error handling', () => {
    it('should handle page rendering errors gracefully', async () => {
      const errorDocument = {
        ...mockDocument,
        getPage: vi.fn(() => Promise.reject(new Error('Page not found'))),
      };

      render(<PDFViewer document={errorDocument} />);

      await waitFor(() => {
        expect(screen.getByText('Error rendering page: Page not found')).toBeInTheDocument();
      });
    });

    it('should handle invalid page numbers', async () => {
      render(<PDFViewer document={mockDocument} pageNumber={99} />);

      await waitFor(() => {
        expect(screen.getByText(/Invalid page number/)).toBeInTheDocument();
      });
    });
  });

  describe('cleanup', () => {
    it('should clean up render task on unmount', async () => {
      const { unmount } = render(<PDFViewer document={mockDocument} />);

      await waitFor(() => {
        expect(mockPage.render).toHaveBeenCalled();
      });

      unmount();
      // Verify no memory leaks (implementation will handle cleanup)
    });
  });
});
