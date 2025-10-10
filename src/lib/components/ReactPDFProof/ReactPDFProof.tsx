import { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';

// Configure worker directly in component to ensure it runs
import '../../config/react-pdf-setup';

export interface ReactPDFProofProps {
  file?: File | null;
}

export function ReactPDFProof({ file }: ReactPDFProofProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [error, setError] = useState<string | null>(null);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setPageNumber(1);
    setError(null); // Clear any previous errors
  }

  function onDocumentLoadError(error: Error) {
    console.error('Error loading PDF with react-pdf:', error);
    setError(error.message || 'Unknown error loading PDF');
  }

  if (!file) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', border: '1px dashed #ccc' }}>
        <p>No PDF file provided for proof-of-concept</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
      <h3>react-pdf Proof of Concept</h3>

      {error && (
        <div
          style={{
            padding: '10px',
            background: '#fee',
            border: '1px solid #fcc',
            borderRadius: '4px',
            marginBottom: '10px',
            color: '#a00',
          }}
        >
          <strong>Error:</strong> {error}
        </div>
      )}

      <Document
        file={file}
        onLoadSuccess={onDocumentLoadSuccess}
        onLoadError={onDocumentLoadError}
        loading={<div>Loading PDF with react-pdf...</div>}
        error={<div>Error loading PDF with react-pdf</div>}
      >
        <Page
          pageNumber={pageNumber}
          loading={<div>Loading page...</div>}
          error={<div>Error loading page</div>}
          renderTextLayer={false}
          renderAnnotationLayer={false}
        />
      </Document>

      {numPages > 0 && (
        <div style={{ marginTop: '10px', textAlign: 'center' }}>
          <p>
            Page {pageNumber} of {numPages}
          </p>
          {numPages > 1 && (
            <div>
              <button
                onClick={() => setPageNumber(Math.max(1, pageNumber - 1))}
                disabled={pageNumber <= 1}
              >
                Previous
              </button>
              <button
                onClick={() => setPageNumber(Math.min(numPages, pageNumber + 1))}
                disabled={pageNumber >= numPages}
                style={{ marginLeft: '10px' }}
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      <div style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
        <p>PDF.js version: {pdfjs.version}</p>
        <p>react-pdf component rendering successfully</p>
      </div>
    </div>
  );
}
