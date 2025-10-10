import { useState, useRef } from 'react';
import { PixelUrl } from '../lib';
import type { NormalizedSelection } from '../lib';
import './App.css';

function App() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Selection state
  const [isSelectionActive, setIsSelectionActive] = useState(false);
  const [lastSelection, setLastSelection] = useState<NormalizedSelection | null>(null);
  const [selectionDataUrl, setSelectionDataUrl] = useState<string | null>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // Clear previous selection when new file is loaded
      setIsSelectionActive(false);
      setLastSelection(null);
      setSelectionDataUrl(null);
    }
  };

  const handleClear = () => {
    setSelectedFile(null);
    setIsSelectionActive(false);
    setLastSelection(null);
    setSelectionDataUrl(null);
    // Clear the file input value to allow re-selecting the same file
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Simplified selection handlers
  const handleSelectionStart = () => {
    console.log('Selection started');
  };

  const handleSelectionComplete = ({
    image,
    coordinates,
  }: {
    image: string | null;
    coordinates: NormalizedSelection;
  }) => {
    console.log('Selection completed:', coordinates);
    console.log('Extracted image:', image ? 'Success' : 'Failed');

    setLastSelection(coordinates);
    setSelectionDataUrl(image);
    setIsSelectionActive(false);
  };

  const handleSelectionCancel = () => {
    console.log('Selection cancelled');
    setIsSelectionActive(false);
  };

  const toggleSelection = () => {
    setIsSelectionActive(prev => !prev);
    if (!isSelectionActive) {
      setLastSelection(null);
      setSelectionDataUrl(null);
    }
  };

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
          </div>
        )}

        <div style={selectedFile ? { display: 'flex', gap: '20px' } : {}}>
          <div>
            <PixelUrl
              file={selectedFile}
              isSelectionActive={isSelectionActive}
              onSelectionStart={handleSelectionStart}
              onSelectionComplete={handleSelectionComplete}
              onSelectionCancel={handleSelectionCancel}
              selectionColor="#007acc"
            />
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
                  {selectionDataUrl ? (
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
              selectedFile && (
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
      </main>
    </div>
  );
}

export default App;
