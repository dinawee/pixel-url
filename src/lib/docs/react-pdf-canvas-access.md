# React-PDF Canvas Access Patterns

## Overview

This document outlines how react-pdf handles canvas rendering and how we can access the canvas for selection overlay functionality.

## Canvas Access Methods

### 1. Direct Canvas Reference

react-pdf's `<Page>` component renders to a canvas element that can be accessed via ref:

```typescript
import { useRef } from 'react';
import { Page } from 'react-pdf';

const PageWithRef = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  return (
    <Page
      pageNumber={1}
      canvasRef={canvasRef}
      // Access canvas via canvasRef.current
    />
  );
};
```

### 2. Canvas Element Discovery

Alternative approach using DOM queries:

```typescript
// Find react-pdf canvas within container
const findReactPDFCanvas = (container: HTMLElement): HTMLCanvasElement | null => {
  return container.querySelector('canvas');
};
```

### 3. Page Callback Access

react-pdf provides callbacks for page rendering:

```typescript
<Page
  pageNumber={1}
  onRenderSuccess={() => {
    // Canvas is ready, selection overlay can be applied
  }}
  onRenderError={(error) => {
    // Handle rendering errors
  }}
/>
```

## Selection Overlay Compatibility

### Current Approach (PDF.js direct)

```typescript
// Our current selection overlay expects direct canvas access
const canvas = canvasRef.current;
const context = canvas.getContext('2d');
// Draw selection rectangle
```

### react-pdf Approach

```typescript
// react-pdf provides the same canvas, just through different means
const Page = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  return (
    <div style={{ position: 'relative' }}>
      <Page pageNumber={1} canvasRef={canvasRef} />
      <SelectionOverlay targetCanvas={canvasRef.current} />
    </div>
  );
};
```

## Key Findings

### ✅ Compatible Features

- **Canvas access**: react-pdf exposes the same HTML5 canvas
- **Coordinate system**: Same PDF coordinate system as direct PDF.js
- **Image extraction**: `canvas.toDataURL()` works identically
- **Event handling**: Mouse/touch events work the same way

### ⚠️ Considerations

- **Timing**: Must wait for `onRenderSuccess` before accessing canvas
- **Re-renders**: Canvas recreated on scale/page changes
- **Element structure**: react-pdf wraps canvas in additional divs

### 🔧 Required Changes

- Update canvas discovery to work with react-pdf structure
- Ensure selection overlay waits for page render completion
- Update coordinate transformation for any wrapper element offsets

## Migration Strategy

### Phase 2 Implementation

1. Replace `PDFViewer` canvas rendering with react-pdf `Page`
2. Update `SelectionOverlay` to discover react-pdf canvas
3. Ensure timing coordination with `onRenderSuccess`
4. Test coordinate accuracy with new canvas structure

### No Breaking Changes Expected

The selection system should work with minimal changes since:

- Same underlying PDF.js canvas
- Same coordinate system
- Same image extraction methods
- Same event model

## Performance Notes

- react-pdf handles canvas optimization internally
- No performance degradation expected for selection functionality
- Potential memory improvements due to react-pdf optimizations

## Conclusion

react-pdf canvas access is fully compatible with our selection overlay system. The migration should be straightforward with minimal changes to selection logic.
