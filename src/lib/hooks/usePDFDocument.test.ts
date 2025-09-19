import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';

// Mock PDF.js - must be at the top before any imports that use it
vi.mock('pdfjs-dist', () => ({
  getDocument: vi.fn(),
  GlobalWorkerOptions: { workerSrc: 'mock-worker.js' },
}));

import { usePDFDocument } from './usePDFDocument';
import { getDocument } from 'pdfjs-dist';
import type { PDFDocumentLoadingTask } from 'pdfjs-dist';

// Get the mocked functions after the mock is set up
const mockPDFDocument = {
  numPages: 5,
  fingerprint: 'mock-fingerprint-123',
  dispose: vi.fn(),
};

const mockGetDocument = vi.mocked(getDocument);

// Test helper to create mock PDF files
const createMockPDFFile = (name = 'test.pdf', size = 1024): File => {
  const content = new Uint8Array(size).fill(0x25); // Fill with '%' (PDF magic number start)
  return new File([content], name, { type: 'application/pdf' });
};

const createInvalidFile = (name = 'invalid.txt'): File => {
  const content = new Uint8Array(100).fill(0x41); // Fill with 'A'
  return new File([content], name, { type: 'text/plain' });
};

describe('usePDFDocument', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default successful mock
    mockGetDocument.mockReturnValue({
      promise: Promise.resolve(mockPDFDocument),
    } as unknown as PDFDocumentLoadingTask);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('should return initial state with no document', () => {
      const { result } = renderHook(() => usePDFDocument());

      expect(result.current.document).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.pageCount).toBe(0);
      expect(typeof result.current.loadDocument).toBe('function');
      expect(typeof result.current.clearDocument).toBe('function');
    });
  });

  describe('loading PDF from file', () => {
    it('should load PDF document from file successfully', async () => {
      const { result } = renderHook(() => usePDFDocument());
      const mockFile = createMockPDFFile('test-document.pdf');

      await result.current.loadDocument(mockFile);

      await waitFor(() => {
        expect(result.current.document).toBe(mockPDFDocument);
        expect(result.current.isLoading).toBe(false);
        expect(result.current.error).toBeNull();
        expect(result.current.pageCount).toBe(5);
      });

      expect(mockGetDocument).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.any(ArrayBuffer),
          enableXfa: false,
        })
      );
    });

    it('should set loading state during document load', async () => {
      const { result } = renderHook(() => usePDFDocument());
      const mockFile = createMockPDFFile();

      let resolvePromise: (value: unknown) => void;
      const delayedPromise = new Promise(resolve => {
        resolvePromise = resolve;
      });

      mockGetDocument.mockReturnValue({
        promise: delayedPromise,
      } as unknown as PDFDocumentLoadingTask);

      // Start loading in act to ensure state updates are captured
      let loadPromise: Promise<void>;
      await act(async () => {
        loadPromise = result.current.loadDocument(mockFile);
        // Give React a chance to update state
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.error).toBeNull();

      await act(async () => {
        resolvePromise!(mockPDFDocument);
        await loadPromise!;
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
        expect(result.current.document).toBe(mockPDFDocument);
      });
    });

    it('should handle PDF loading errors gracefully', async () => {
      const { result } = renderHook(() => usePDFDocument());
      const mockFile = createMockPDFFile();

      // Create a properly rejected promise that won't cause unhandled rejection
      const rejectedPromise = Promise.reject(new Error('Invalid PDF format'));
      // Immediately catch it to prevent unhandled rejection
      rejectedPromise.catch(() => {});

      mockGetDocument.mockReturnValue({
        promise: rejectedPromise,
      } as unknown as PDFDocumentLoadingTask);

      await act(async () => {
        await result.current.loadDocument(mockFile);
      });

      await waitFor(() => {
        expect(result.current.document).toBeNull();
        expect(result.current.isLoading).toBe(false);
        expect(result.current.error).toBe('Invalid PDF format');
        expect(result.current.pageCount).toBe(0);
      });
    });

    it('should validate file type before loading', async () => {
      const { result } = renderHook(() => usePDFDocument());
      const invalidFile = createInvalidFile('document.txt');

      await result.current.loadDocument(invalidFile);

      await waitFor(() => {
        expect(result.current.error).toBe('Invalid file type. Please select a PDF file.');
        expect(result.current.document).toBeNull();
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockGetDocument).not.toHaveBeenCalled();
    });

    it('should validate file size limits', async () => {
      const { result } = renderHook(() => usePDFDocument());
      // Create a file larger than 50MB
      const oversizedFile = createMockPDFFile('huge.pdf', 51 * 1024 * 1024);

      await result.current.loadDocument(oversizedFile);

      await waitFor(() => {
        expect(result.current.error).toBe('File size exceeds 50MB limit.');
        expect(result.current.document).toBeNull();
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockGetDocument).not.toHaveBeenCalled();
    });
  });

  describe('loading PDF from URL', () => {
    it('should load PDF document from URL successfully', async () => {
      const { result } = renderHook(() => usePDFDocument());
      const testUrl = 'https://example.com/test.pdf';

      await result.current.loadDocument(testUrl);

      await waitFor(() => {
        expect(result.current.document).toBe(mockPDFDocument);
        expect(result.current.error).toBeNull();
        expect(result.current.pageCount).toBe(5);
      });

      expect(mockGetDocument).toHaveBeenCalledWith(
        expect.objectContaining({
          url: testUrl,
          enableXfa: false,
        })
      );
    });

    it('should handle invalid URL format', async () => {
      const { result } = renderHook(() => usePDFDocument());
      const invalidUrl = 'not-a-valid-url';

      await result.current.loadDocument(invalidUrl);

      await waitFor(() => {
        expect(result.current.error).toBe('Invalid URL format.');
        expect(result.current.document).toBeNull();
      });
    });

    it('should handle network errors for URL loading', async () => {
      const { result } = renderHook(() => usePDFDocument());
      const testUrl = 'https://example.com/nonexistent.pdf';

      // Create a properly rejected promise that won't cause unhandled rejection
      const rejectedPromise = Promise.reject(new Error('Network request failed'));
      // Immediately catch it to prevent unhandled rejection
      rejectedPromise.catch(() => {});

      mockGetDocument.mockReturnValue({
        promise: rejectedPromise,
      } as unknown as PDFDocumentLoadingTask);

      await act(async () => {
        await result.current.loadDocument(testUrl);
      });

      await waitFor(() => {
        expect(result.current.error).toBe('Network request failed');
        expect(result.current.document).toBeNull();
      });
    });
  });

  describe('document management', () => {
    it('should clear document and reset state', async () => {
      const { result } = renderHook(() => usePDFDocument());
      const mockFile = createMockPDFFile();

      await act(async () => {
        await result.current.loadDocument(mockFile);
      });

      await waitFor(() => {
        expect(result.current.document).toBe(mockPDFDocument);
      });

      await act(async () => {
        result.current.clearDocument();
      });

      expect(result.current.document).toBeNull();
      expect(result.current.error).toBeNull();
      expect(result.current.pageCount).toBe(0);
      expect(result.current.isLoading).toBe(false);
      expect(mockPDFDocument.dispose).toHaveBeenCalled();
    });

    it('should dispose previous document when loading new one', async () => {
      const { result } = renderHook(() => usePDFDocument());
      const firstFile = createMockPDFFile('first.pdf');
      const secondFile = createMockPDFFile('second.pdf');

      const firstMockDocument = { ...mockPDFDocument, dispose: vi.fn() };
      const secondMockDocument = { ...mockPDFDocument, dispose: vi.fn() };

      mockGetDocument.mockReturnValueOnce({
        promise: Promise.resolve(firstMockDocument),
      } as unknown as PDFDocumentLoadingTask);

      await act(async () => {
        await result.current.loadDocument(firstFile);
      });

      await waitFor(() => {
        expect(result.current.document).toBe(firstMockDocument);
      });

      mockGetDocument.mockReturnValueOnce({
        promise: Promise.resolve(secondMockDocument),
      } as unknown as PDFDocumentLoadingTask);
      await act(async () => {
        await result.current.loadDocument(secondFile);
      });

      await waitFor(() => {
        expect(firstMockDocument.dispose).toHaveBeenCalled();
        expect(result.current.document).toBe(secondMockDocument);
      });
    });
  });

  describe('hook cleanup', () => {
    it('should dispose document on unmount', async () => {
      const { result, unmount } = renderHook(() => usePDFDocument());
      const mockFile = createMockPDFFile();

      await act(async () => {
        await result.current.loadDocument(mockFile);
      });

      await waitFor(() => {
        expect(result.current.document).toBe(mockPDFDocument);
      });

      await act(async () => {
        unmount();
      });

      expect(mockPDFDocument.dispose).toHaveBeenCalled();
    });
  });
});
