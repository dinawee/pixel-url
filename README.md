# React PDF Selection Tool

A React library for PDF viewing with interactive area selection and image extraction.

## Features

- 📄 PDF viewing with zoom and navigation
- 🎯 Interactive area selection on PDF pages
- 🖼️ Extract selected areas as images
- ⚡ Lightweight bundle (~617KB)

## Installation

```bash
npm install pixel-url
```

## Usage

```tsx
import { ReactPDFViewerWithSelection } from 'pixel-url';

<ReactPDFViewerWithSelection
  file={pdfFile}
  pageNumber={1}
  scale={1}
  isSelectionActive={true}
  onSelectionComplete={selection => console.log(selection)}
/>;
```

## Demo

See the demo app in `src/demo/` for a complete working example.

```bash
npm run dev:demo
```

## Development

```bash
npm install
npm test
npm run build:lib
```

## License

MIT
