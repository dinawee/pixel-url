/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useReactPDFDocument } from './useReactPDFDocument';

describe('useReactPDFDocument', () => {
  let mockFile: File;

  beforeEach(() => {
    mockFile = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useReactPDFDocument());

    expect(result.current.file).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.pageCount).toBe(0);
    expect(typeof result.current.loadDocument).toBe('function');
    expect(typeof result.current.clearDocument).toBe('function');
  });

  it('should clear document state', () => {
    const { result } = renderHook(() => useReactPDFDocument());

    act(() => {
      result.current.clearDocument();
    });

    expect(result.current.file).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.pageCount).toBe(0);
    expect(result.current.isLoading).toBe(false);
  });

  it('should load a valid PDF file', async () => {
    const { result } = renderHook(() => useReactPDFDocument());

    await act(async () => {
      await result.current.loadDocument(mockFile);
    });

    expect(result.current.file).toBe(mockFile);
    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it('should load a valid PDF URL', async () => {
    const { result } = renderHook(() => useReactPDFDocument());
    const testUrl = 'https://example.com/test.pdf';

    await act(async () => {
      await result.current.loadDocument(testUrl);
    });

    expect(result.current.file).toBe(testUrl);
    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it('should reject invalid file type', async () => {
    const { result } = renderHook(() => useReactPDFDocument());
    const invalidFile = new File(['test'], 'test.txt', { type: 'text/plain' });

    await act(async () => {
      await result.current.loadDocument(invalidFile);
    });

    expect(result.current.file).toBeNull();
    expect(result.current.error).toBe('Invalid file type. Please select a PDF file.');
    expect(result.current.isLoading).toBe(false);
  });

  it('should reject files exceeding size limit', async () => {
    const { result } = renderHook(() => useReactPDFDocument());

    // Create a large file (over 50MB)
    const largeContent = new Uint8Array(51 * 1024 * 1024); // 51MB
    const largeFile = new File([largeContent], 'large.pdf', { type: 'application/pdf' });

    await act(async () => {
      await result.current.loadDocument(largeFile);
    });

    expect(result.current.file).toBeNull();
    expect(result.current.error).toBe('File size exceeds 50MB limit.');
    expect(result.current.isLoading).toBe(false);
  });

  it('should reject invalid URLs', async () => {
    const { result } = renderHook(() => useReactPDFDocument());

    await act(async () => {
      await result.current.loadDocument('invalid-url');
    });

    expect(result.current.file).toBeNull();
    expect(result.current.error).toBe('Invalid URL format.');
    expect(result.current.isLoading).toBe(false);
  });

  it('should handle document load success callback', () => {
    const { result } = renderHook(() => useReactPDFDocument());

    act(() => {
      (result.current as any).handleDocumentLoadSuccess({ numPages: 5 });
    });

    expect(result.current.pageCount).toBe(5);
    expect(result.current.error).toBeNull();
  });

  it('should handle document load error callback', () => {
    const { result } = renderHook(() => useReactPDFDocument());
    const testError = new Error('Failed to load PDF');

    act(() => {
      (result.current as any).handleDocumentLoadError(testError);
    });

    expect(result.current.error).toBe('Failed to load PDF');
    expect(result.current.file).toBeNull();
    expect(result.current.pageCount).toBe(0);
  });

  it('should clear previous errors when loading new document', async () => {
    const { result } = renderHook(() => useReactPDFDocument());

    // First load an invalid file to set error state
    const invalidFile = new File(['test'], 'test.txt', { type: 'text/plain' });
    await act(async () => {
      await result.current.loadDocument(invalidFile);
    });
    expect(result.current.error).toBeTruthy();

    // Then load a valid file
    await act(async () => {
      await result.current.loadDocument(mockFile);
    });

    expect(result.current.error).toBeNull();
    expect(result.current.file).toBe(mockFile);
  });
});
