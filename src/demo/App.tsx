import { useState, useCallback, useRef, useEffect } from 'react';
import {
  usePDFDocument,
  PDFViewer,
  PDFPageNavigation,
  PDFZoomControls,
  useScrollPan,
} from '@pixel-url/core';
import './App.css';

function App() {
  const { document, isLoading, error, pageCount, loadDocument, clearDocument } = usePDFDocument();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollToRef = useRef<((x: number, y: number) => void) | null>(null);

  const handlePageBoundary = useCallback(
    (direction: 'next' | 'prev') => {
      if (direction === 'next' && currentPage < pageCount) {
        setCurrentPage(currentPage + 1);
        // Reset scroll to top of new page after a brief delay for rendering
        setTimeout(() => {
          scrollToRef.current?.(0, 0);
        }, 50);
      } else if (direction === 'prev' && currentPage > 1) {
        setCurrentPage(currentPage - 1);
        // Reset scroll to bottom of new page after a brief delay for rendering
        setTimeout(() => {
          if (containerRef.current && scrollToRef.current) {
            const maxScrollTop =
              containerRef.current.scrollHeight - containerRef.current.clientHeight;
            scrollToRef.current(0, maxScrollTop);
          }
        }, 50);
      }
    },
    [currentPage, pageCount]
  );

  const { isPanning, scrollPosition, attachContainer, scrollTo, centerContent } =
    useScrollPan(handlePageBoundary);

  // Store scrollTo function in ref so handlePageBoundary can access it
  useEffect(() => {
    scrollToRef.current = scrollTo;
  }, [scrollTo]);

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

  // Attach container to scroll/pan hook
  useEffect(() => {
    attachContainer(containerRef.current);
  }, [attachContainer]);

  // Center content only on zoom changes, not initial load or page changes
  useEffect(() => {
    if (document && scale !== 1) {
      // Only center when zoomed (not at 100%)
      const timer = setTimeout(() => {
        centerContent();
      }, 100);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scale, centerContent]); // no centering on doc change

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

        {document && (
          <div
            style={{
              marginBottom: '10px',
              textAlign: 'center',
              fontSize: '12px',
              color: '#666',
              fontFamily: 'monospace',
            }}
          >
            Scroll: ({Math.round(scrollPosition.x)}, {Math.round(scrollPosition.y)})
            {isPanning && ' • Panning...'}
            <br />
            <span style={{ fontSize: '10px' }}>
              Click and drag to pan • Mouse wheel/arrows cross pages • Keyboard: ↑↓←→ PgUp PgDn Home
              End
            </span>
          </div>
        )}

        <div
          ref={containerRef}
          style={{
            border: '1px solid #ccc',
            borderRadius: '8px',
            overflow: 'auto',
            width: document ? '800px' : 'auto', // Fixed width
            height: document ? '600px' : 'auto', // Fixed height
            margin: '0 auto', // Center the container
            padding: document ? '0' : '10px',
            cursor: isPanning ? 'grabbing' : document ? 'grab' : 'default',
            userSelect: 'none', // Prevent text selection while panning
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
