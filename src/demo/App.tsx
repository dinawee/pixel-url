import { useState } from 'react';
import { usePDFDocument, PDFViewer, PDFPageNavigation } from '@pixel-url/core';
import './App.css';

function App() {
  const { document, isLoading, error, pageCount, loadDocument, clearDocument } = usePDFDocument();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setCurrentPage(1); // Reset to first page
      await loadDocument(file);
    }
  };

  const handleClear = () => {
    clearDocument();
    setSelectedFile(null);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

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

        {document && pageCount > 1 && (
          <div style={{ marginBottom: '15px', display: 'flex', justifyContent: 'center' }}>
            <PDFPageNavigation
              currentPage={currentPage}
              totalPages={pageCount}
              onPageChange={handlePageChange}
            />
          </div>
        )}

        <div style={{ border: '1px solid #ccc', padding: '20px', borderRadius: '8px' }}>
          <PDFViewer
            document={document}
            isLoading={isLoading}
            error={error}
            scale={1}
            pageNumber={currentPage}
          />
        </div>
      </main>
    </div>
  );
}

export default App;
