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
import { PixelUrl } from 'pixel-url';

<PixelUrl
  file={pdfFile}
  onSelectionComplete={({ image, coordinates }) => {
    console.log('Extracted image:', image);
    console.log('Selection coordinates:', coordinates);
  }}
/>;
```

## API Reference

### PixelUrl Component

#### Props

| Prop                  | Type                     | Default     | Description                                                |
| --------------------- | ------------------------ | ----------- | ---------------------------------------------------------- |
| `file`                | `File \| string \| null` | `null`      | PDF file to display (File object, URL string, or null)     |
| `onSelectionComplete` | `function`               | -           | Callback when selection is completed                       |
| `onSelectionStart`    | `function`               | -           | Callback when selection starts                             |
| `onSelectionCancel`   | `function`               | -           | Callback when selection is cancelled                       |
| `isSelectionActive`   | `boolean`                | `false`     | Whether selection mode is active                           |
| `selectionColor`      | `string`                 | `'#0066cc'` | Color of selection overlay                                 |
| `showNavigation`      | `boolean`                | `true`      | Show page navigation controls (auto-hides for single page) |
| `showZoomControls`    | `boolean`                | `true`      | Show zoom controls                                         |
| `enablePanning`       | `boolean`                | `true`      | Enable scroll/pan functionality                            |
| `className`           | `string`                 | -           | CSS class name for root container                          |
| `style`               | `React.CSSProperties`    | -           | Inline styles for root container                           |

#### onSelectionComplete Callback

```tsx
onSelectionComplete: (result: {
  image: string | null;      // Base64 data URL of extracted image (null if failed)
  coordinates: {             // Selection coordinates
    x: number;               // X position (normalized 0-1)
    y: number;               // Y position (normalized 0-1)
    width: number;           // Width (normalized 0-1)
    height: number;          // Height (normalized 0-1)
    pageNumber: number;      // Page number (1-indexed)
    scale: number;           // Current zoom scale
    normalized: boolean;     // Always true
  }
}) => void;
```

#### Keyboard Shortcuts

| Key                 | Action                   |
| ------------------- | ------------------------ |
| `←` `→` `↑` `↓`     | Navigate pages           |
| `+` `-`             | Zoom in/out              |
| `0`                 | Reset zoom               |
| `PageUp` `PageDown` | Navigate pages           |
| `Home` `End`        | First/last page          |
| `Escape`            | Cancel selection         |
| Click + Drag        | Pan (when not selecting) |

### Advanced Usage

For fine-grained control, individual components are also available:

```tsx
import { ReactPDFViewerWithSelection, PDFPageNavigation } from 'pixel-url';
// Use individual components with manual state management
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
