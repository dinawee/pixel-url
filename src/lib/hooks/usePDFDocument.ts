import { useState, useEffect, useCallback } from 'react';
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import type { PDFDocument, UsePDFDocumentReturn } from '../types/internal';

// Configure PDF.js worker (only in browser, exclude tests)
const setupWorker = () => {
  if (typeof window !== 'undefined' && !import.meta.env?.VITEST) {
    GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.min.mjs',
      import.meta.url
    ).toString();
  }
};

setupWorker();

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

const isValidURL = (string: string): boolean => {
  try {
    new URL(string);
    return true;
  } catch {
    return false;
  }
};

const validateFile = (file: File): string | null => {
  if (file.type !== 'application/pdf') {
    return 'Invalid file type. Please select a PDF file.';
  }

  if (file.size > MAX_FILE_SIZE) {
    return 'File size exceeds 50MB limit.';
  }

  return null;
};

const fileToArrayBuffer = (file: File): Promise<ArrayBuffer> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
};

export const usePDFDocument = (): UsePDFDocumentReturn => {
  const [document, setDocument] = useState<PDFDocument | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pageCount, setPageCount] = useState(0);

  const clearDocument = useCallback(() => {
    if (document) {
      document.dispose();
    }
    setDocument(null);
    setError(null);
    setPageCount(0);
    setIsLoading(false);
  }, [document]);

  const loadDocument = useCallback(
    async (source: File | string): Promise<void> => {
      try {
        // Clear any previous errors
        setError(null);
        setIsLoading(true);

        // Dispose previous document if it exists
        if (document) {
          document.dispose();
          setDocument(null);
          setPageCount(0);
        }

        let loadingTask;

        if (typeof source === 'string') {
          // Handle URL
          if (!isValidURL(source)) {
            throw new Error('Invalid URL format.');
          }

          loadingTask = getDocument({
            url: source,
            enableXfa: false,
          });
        } else {
          // Handle File
          const validationError = validateFile(source);
          if (validationError) {
            throw new Error(validationError);
          }

          const arrayBuffer = await fileToArrayBuffer(source);
          loadingTask = getDocument({
            data: arrayBuffer,
            enableXfa: false,
          });
        }

        const pdfDoc = await loadingTask.promise;

        setDocument(pdfDoc as PDFDocument);
        setPageCount(pdfDoc.numPages);
        setError(null);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        setError(errorMessage);
        setDocument(null);
        setPageCount(0);
      } finally {
        setIsLoading(false);
      }
    },
    [document]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (document) {
        document.dispose();
      }
    };
  }, [document]);

  return {
    document,
    isLoading,
    error,
    pageCount,
    loadDocument,
    clearDocument,
  };
};
