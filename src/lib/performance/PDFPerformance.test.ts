/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { usePDFDocument } from '../hooks/usePDFDocument';

// Mock PDF.js with performance considerations
vi.mock('pdfjs-dist', () => ({
  getDocument: vi.fn(),
  GlobalWorkerOptions: { workerSrc: 'mock-worker.js' },
}));

// Helper to create large mock PDF files
const createLargePDFFile = (sizeInMB: number, name = 'large.pdf'): File => {
  const sizeInBytes = sizeInMB * 1024 * 1024;
  const content = new Uint8Array(sizeInBytes).fill(0x25); // Fill with PDF magic bytes
  return new File([content], name, { type: 'application/pdf' });
};

// Mock performance observer if not available
if (typeof performance === 'undefined') {
  global.performance = {
    now: () => Date.now(),
    mark: vi.fn(),
    measure: vi.fn(),
  } as any;
}

describe('PDF Performance Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create large file objects efficiently', () => {
    const startTime = performance.now();

    // Test file creation performance
    const largeFile = createLargePDFFile(10);

    const creationTime = performance.now() - startTime;

    // File creation should be fast (< 100ms)
    expect(creationTime).toBeLessThan(100);
    expect(largeFile.size).toBe(10 * 1024 * 1024); // 10MB
    expect(largeFile.type).toBe('application/pdf');
    expect(largeFile.name).toBe('large.pdf');
  });

  it('should handle multiple file creations efficiently', () => {
    const startTime = performance.now();

    // Create multiple large files to test memory allocation
    const files = [];
    for (let i = 0; i < 5; i++) {
      files.push(createLargePDFFile(1, `test-${i}.pdf`));
    }

    const totalTime = performance.now() - startTime;

    // Multiple file creation should be efficient (< 500ms)
    expect(totalTime).toBeLessThan(500);
    expect(files).toHaveLength(5);
    files.forEach((file, index) => {
      expect(file.name).toBe(`test-${index}.pdf`);
      expect(file.size).toBe(1024 * 1024); // 1MB each
    });
  });

  it('should handle rapid hook state changes efficiently', () => {
    const { result } = renderHook(() => usePDFDocument());

    const startTime = performance.now();

    // Test rapid state access (simulating rapid re-renders)
    for (let i = 0; i < 100; i++) {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.document).toBeNull();
      expect(result.current.error).toBeNull();
      expect(result.current.pageCount).toBe(0);
    }

    const operationTime = performance.now() - startTime;

    // Rapid state access should be very fast (< 50ms)
    expect(operationTime).toBeLessThan(50);
  });

  it('should maintain consistent performance with hook cleanup', () => {
    const startTime = performance.now();

    // Test multiple hook mount/unmount cycles
    for (let i = 0; i < 10; i++) {
      const { result, unmount } = renderHook(() => usePDFDocument());

      // Access state
      expect(result.current.document).toBeNull();
      expect(result.current.isLoading).toBe(false);

      // Cleanup
      unmount();
    }

    const totalTime = performance.now() - startTime;

    // Multiple hook lifecycles should be efficient (< 200ms)
    expect(totalTime).toBeLessThan(200);
  });

  it('should handle array operations efficiently for large datasets', () => {
    const startTime = performance.now();

    // Simulate processing large page arrays (like a 500-page document)
    const pageNumbers = Array.from({ length: 500 }, (_, i) => i + 1);

    // Test various array operations that might be used in PDF viewer
    const evenPages = pageNumbers.filter(p => p % 2 === 0);
    const pageMap = pageNumbers.map(p => ({ page: p, rendered: false }));
    const totalPages = pageNumbers.reduce((sum, p) => sum + p, 0);

    const operationTime = performance.now() - startTime;

    // Array operations should be fast (< 100ms)
    expect(operationTime).toBeLessThan(100);
    expect(evenPages).toHaveLength(250);
    expect(pageMap).toHaveLength(500);
    expect(totalPages).toBe(125250); // Sum of 1..500
  });
});
