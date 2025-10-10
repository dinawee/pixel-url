import { useState, useCallback, useRef, useEffect } from 'react';
import {
  usePDFDocument,
  PDFPageNavigation,
  PDFZoomControls,
  useScrollPan,
  PDFViewerWithSelection,
  extractSelectionImage,
} from '@pixel-url/core';
import type { NormalizedSelection } from '@pixel-url/core';
import { ReactPDFProof } from '../lib/components/ReactPDFProof';
import './App.css';

function App() {
  const { document, isLoading, error, pageCount, loadDocument, clearDocument } = usePDFDocument();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollToRef = useRef<((x: number, y: number) => void) | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Selection state
  const [isSelectionActive, setIsSelectionActive] = useState(false);
  const [lastSelection, setLastSelection] = useState<NormalizedSelection | null>(null);
  const [selectionDataUrl, setSelectionDataUrl] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);

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

  const { isPanning, scrollPosition, attachContainer, scrollTo, centerContent } = useScrollPan(
    handlePageBoundary,
    { disabled: isSelectionActive }
  );

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
    // Clear selection state and image display
    setIsSelectionActive(false);
    setLastSelection(null);
    setSelectionDataUrl(null);
    setIsExtracting(false);
    // Clear the file input value to allow re-selecting the same file
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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

  // Selection handlers
  const handleSelectionStart = useCallback(() => {
    console.log('Selection started');
  }, []);

  const handleSelectionComplete = useCallback((selection: NormalizedSelection) => {
    console.log('Selection completed:', selection);
    setLastSelection(selection);
    setIsSelectionActive(false);
    setIsExtracting(true);

    // Extract the actual image from the PDF canvas
    if (containerRef.current) {
      try {
        const imageDataUrl = extractSelectionImage(containerRef.current, selection);
        if (imageDataUrl) {
          setSelectionDataUrl(imageDataUrl);
          console.log('Successfully extracted image from selection');
        } else {
          console.warn('Failed to extract image from selection');
          // Fallback to placeholder
          setSelectionDataUrl(
            `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==`
          );
        }
      } catch (error) {
        console.error('Error extracting selection image:', error);
        // Fallback to placeholder
        setSelectionDataUrl(
          `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==`
        );
      }
    }

    setIsExtracting(false);
  }, []);

  const handleSelectionCancel = useCallback(() => {
    console.log('Selection cancelled');
    setIsSelectionActive(false);
  }, []);

  const toggleSelection = useCallback(() => {
    setIsSelectionActive(prev => !prev);
    if (!isSelectionActive) {
      setLastSelection(null);
      setSelectionDataUrl(null);
    }
  }, [isSelectionActive]);

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
      </header>

      <main style={{ padding: '20px' }}>
        <div style={{ marginBottom: '20px' }}>
          <input
            ref={fileInputRef}
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

        <div style={document ? { display: 'flex', gap: '20px' } : {}}>
          <div>
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
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <PDFZoomControls
                    scale={scale}
                    hasDocument={!!document}
                    onScaleChange={handleScaleChange}
                  />
                </div>
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
                  Click and drag to pan • Mouse wheel/arrows cross pages • Keyboard: ↑↓←→ PgUp PgDn
                  Home End
                </span>
              </div>
            )}

            <div
              ref={containerRef}
              style={{
                border: '1px solid #ccc',
                borderRadius: '8px',
                overflow: isSelectionActive ? 'hidden' : 'auto', // Disable scroll when selection is active
                width: document ? '800px' : 'auto', // Fixed width
                height: document ? '600px' : 'auto', // Fixed height
                margin: '0 auto', // Center the container
                padding: document ? '0' : '10px',
                cursor: isPanning ? 'grabbing' : document ? 'grab' : 'default',
                userSelect: 'none', // Prevent text selection while panning
              }}
            >
              <PDFViewerWithSelection
                document={document}
                isLoading={isLoading}
                error={error}
                scale={scale}
                pageNumber={currentPage}
                isSelectionActive={isSelectionActive}
                onSelectionStart={handleSelectionStart}
                onSelectionComplete={handleSelectionComplete}
                onSelectionCancel={handleSelectionCancel}
                selectionColor="#007acc"
              />
            </div>
          </div>

          {/* Selection Results Display */}
          <div style={{ width: '400px', flexShrink: 0 }}>
            {lastSelection ? (
              <div
                style={{
                  marginTop: '20px',
                  padding: '15px',
                  background: '#f8f9fa',
                  border: '1px solid #dee2e6',
                  borderRadius: '8px',
                  width: '100%',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '10px',
                  }}
                >
                  <h3 style={{ margin: '0', color: '#495057' }}>Last Selection</h3>
                  <button
                    onClick={toggleSelection}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '4px',
                      border: '1px solid #ccc',
                      background: isSelectionActive ? '#007acc' : '#f5f5f5',
                      color: isSelectionActive ? 'white' : '#333',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: isSelectionActive ? 'bold' : 'normal',
                    }}
                  >
                    {isSelectionActive ? 'Cancel' : 'New Selection'}
                  </button>
                </div>
                <div style={{ fontFamily: 'monospace', fontSize: '12px', color: '#6c757d' }}>
                  <div>
                    <strong>Coordinates:</strong> x: {lastSelection.x.toFixed(2)}, y:{' '}
                    {lastSelection.y.toFixed(2)}
                  </div>
                  <div>
                    <strong>Dimensions:</strong> {lastSelection.width.toFixed(2)} ×{' '}
                    {lastSelection.height.toFixed(2)}
                  </div>
                  <div>
                    <strong>Page:</strong> {lastSelection.pageNumber}
                  </div>
                  <div>
                    <strong>Scale:</strong> {lastSelection.scale.toFixed(2)}
                  </div>
                </div>
                <div style={{ marginTop: '10px' }}>
                  <div style={{ marginBottom: '5px', fontSize: '12px', color: '#6c757d' }}>
                    <strong>Extracted Image:</strong>
                  </div>
                  {isExtracting ? (
                    <div
                      style={{
                        padding: '20px',
                        textAlign: 'center',
                        color: '#6c757d',
                        border: '1px dashed #ccc',
                        borderRadius: '4px',
                      }}
                    >
                      Extracting image...
                    </div>
                  ) : selectionDataUrl ? (
                    <img
                      src={selectionDataUrl}
                      alt="Selected area"
                      style={{
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        maxWidth: '300px',
                        maxHeight: '300px',
                        display: 'block',
                        margin: 'auto',
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        padding: '20px',
                        textAlign: 'center',
                        color: '#6c757d',
                        border: '1px dashed #ccc',
                        borderRadius: '4px',
                      }}
                    >
                      No image extracted yet
                    </div>
                  )}
                </div>
              </div>
            ) : (
              document && (
                <div
                  style={{
                    marginTop: '20px',
                    padding: '15px',
                    background: '#f8f9fa',
                    border: '1px solid #dee2e6',
                    borderRadius: '8px',
                    width: '100%',
                    textAlign: 'center',
                    color: '#6c757d',
                  }}
                >
                  <h3 style={{ margin: '0 0 10px 0', color: '#495057' }}>Image Selection</h3>
                  <p style={{ margin: '0 0 15px 0', fontSize: '14px' }}>
                    Click "Start Selection" and draw a rectangle on the PDF to extract an image.
                    Click again to confirm selection.
                  </p>
                  <button
                    onClick={toggleSelection}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '4px',
                      border: '1px solid #ccc',
                      background: isSelectionActive ? '#007acc' : '#f5f5f5',
                      color: isSelectionActive ? 'white' : '#333',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: isSelectionActive ? 'bold' : 'normal',
                    }}
                  >
                    {isSelectionActive ? 'Cancel Selection' : 'Start Selection'}
                  </button>
                </div>
              )
            )}
          </div>
        </div>

        {/* react-pdf Proof of Concept - Only show when we have a file to test */}
        {selectedFile && (
          <div style={{ marginTop: '40px', padding: '20px', borderTop: '2px solid #eee' }}>
            <h2>react-pdf Migration Proof of Concept</h2>
            <ReactPDFProof file={selectedFile} />
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
