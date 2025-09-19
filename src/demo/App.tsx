import { useState, useCallback } from 'react';
import { usePDFDocument, PDFViewer, PDFPageNavigation, PDFZoomControls } from '@pixel-url/core';
import './App.css';

function App() {
  const { document, isLoading, error, pageCount, loadDocument, clearDocument } = usePDFDocument();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setCurrentPage(1); // Reset to first page
      setScale(1); // Reset zoom
      await loadDocument(file);
    }
  };

  const handleClear = () => {
    clearDocument();
    setSelectedFile(null);
    setCurrentPage(1);
    setScale(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleScaleChange = useCallback((newScale: number | 'fit-width') => {
    if (newScale === 'fit-width') {
      // For now, set a reasonable fit-width scale
      // In a real implementation, this would calculate based on container width
      setScale(1.2);
    } else {
      setScale(newScale);
    }
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <h1>Pixel URL - PDF Selection Tool Demo</h1>
        <p>Upload a PDF to test the viewer component</p>
      </header>

      <main style={{ padding: '20px' }}>
        <div style={{ marginBottom: '20px' }}>
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            style={{ marginRight: '10px' }}
          />
          {selectedFile && (
            <button onClick={handleClear} style={{ marginLeft: '10px' }}>
              Clear PDF
            </button>
          )}
        </div>

        {selectedFile && (
          <div style={{ marginBottom: '10px' }}>
            <strong>Selected file:</strong> {selectedFile.name}
            {pageCount > 0 && (
              <span style={{ marginLeft: '10px', color: '#666' }}>
                ({pageCount} page{pageCount !== 1 ? 's' : ''})
              </span>
            )}
          </div>
        )}

        {document && (
          <div
            style={{
              marginBottom: '15px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '10px',
            }}
          >
            <PDFZoomControls
              scale={scale}
              hasDocument={!!document}
              onScaleChange={handleScaleChange}
            />
            {pageCount > 1 && (
              <PDFPageNavigation
                currentPage={currentPage}
                totalPages={pageCount}
                onPageChange={handlePageChange}
              />
            )}
          </div>
        )}

        <div
          style={{
            border: '1px solid #ccc',
            borderRadius: '8px',
            overflow: 'auto',
            width: document ? '800px' : 'auto', // Fixed width
            height: document ? '600px' : 'auto', // Fixed height
            margin: '0 auto', // Center the container
            padding: document ? '0' : '10px',
          }}
        >
          <PDFViewer
            document={document}
            isLoading={isLoading}
            error={error}
            scale={scale}
            pageNumber={currentPage}
          />
        </div>
      </main>
    </div>
  );
}

export default App;
