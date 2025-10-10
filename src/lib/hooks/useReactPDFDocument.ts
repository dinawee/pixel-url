import { useState, useCallback } from 'react';

// Types that match our existing API
export interface ReactPDFDocumentResult {
  file: File | string | null;
  isLoading: boolean;
  error: string | null;
  pageCount: number;
  loadDocument: (source: File | string) => Promise<void>;
  clearDocument: () => void;
}

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

export const useReactPDFDocument = (): ReactPDFDocumentResult => {
  const [file, setFile] = useState<File | string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pageCount, setPageCount] = useState(0);

  const clearDocument = useCallback(() => {
    setFile(null);
    setError(null);
    setPageCount(0);
    setIsLoading(false);
  }, []);

  const loadDocument = useCallback(async (source: File | string): Promise<void> => {
    try {
      // Clear any previous errors
      setError(null);
      setIsLoading(true);

      // Clear previous document
      setFile(null);
      setPageCount(0);

      if (typeof source === 'string') {
        // Handle URL
        if (!isValidURL(source)) {
          throw new Error('Invalid URL format.');
        }
        setFile(source);
      } else {
        // Handle File
        const validationError = validateFile(source);
        if (validationError) {
          throw new Error(validationError);
        }
        setFile(source);
      }

      // Note: pageCount will be set by onDocumentLoadSuccess callback
      // from the Document component
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      setFile(null);
      setPageCount(0);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // This will be called by the Document component
  const handleDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setPageCount(numPages);
    setError(null);
  }, []);

  // This will be called by the Document component
  const handleDocumentLoadError = useCallback((error: Error) => {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    setError(errorMessage);
    setFile(null);
    setPageCount(0);
  }, []);

  return {
    file,
    isLoading,
    error,
    pageCount,
    loadDocument,
    clearDocument,
    // Export these for the Document component to use
    handleDocumentLoadSuccess,
    handleDocumentLoadError,
  } as ReactPDFDocumentResult & {
    handleDocumentLoadSuccess: (result: { numPages: number }) => void;
    handleDocumentLoadError: (error: Error) => void;
  };
};
