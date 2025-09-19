import { PDFSelectionTool } from '@pixel-url/core';
import type { SelectionResult } from '@pixel-url/core';
import './App.css';

function App() {
  const handleSelectionComplete = (selection: SelectionResult) => {
    console.log('Selection completed:', selection);
    // TODO: Display selection results in demo UI
  };

  const handleError = (error: Error) => {
    console.error('PDF Selection Error:', error);
    // TODO: Display error in demo UI
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Pixel URL - PDF Selection Tool Demo</h1>
        <p>Upload a PDF and draw selections to extract image data URLs</p>
      </header>

      <main>
        <PDFSelectionTool
          onSelectionComplete={handleSelectionComplete}
          onError={handleError}
          className="pdf-selection-demo"
        />
      </main>
    </div>
  );
}

export default App;
