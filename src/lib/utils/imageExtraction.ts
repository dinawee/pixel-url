import type { NormalizedSelection } from './coordinateTransform';

/**
 * Extract image data from a canvas element based on selection coordinates
 */
export const extractSelectionFromCanvas = (
  sourceCanvas: HTMLCanvasElement,
  selection: NormalizedSelection,
  scale: number = 1
): string | null => {
  try {
    // Create a new canvas for the extracted selection
    const extractionCanvas = document.createElement('canvas');
    const ctx = extractionCanvas.getContext('2d');

    if (!ctx) {
      console.error('Failed to get 2D context for extraction canvas');
      return null;
    }

    // Calculate actual pixel coordinates on the source canvas
    // The selection coordinates are in PDF coordinate space, we need screen coordinates
    const scaledX = selection.x * scale;
    const scaledY = selection.y * scale;
    const scaledWidth = selection.width * scale;
    const scaledHeight = selection.height * scale;

    // Set the extraction canvas size to match the selection
    extractionCanvas.width = Math.abs(scaledWidth);
    extractionCanvas.height = Math.abs(scaledHeight);

    // Ensure we're within canvas bounds
    const sourceWidth = sourceCanvas.width;
    const sourceHeight = sourceCanvas.height;

    const clampedX = Math.max(0, Math.min(scaledX, sourceWidth));
    const clampedY = Math.max(0, Math.min(scaledY, sourceHeight));
    const clampedWidth = Math.min(Math.abs(scaledWidth), sourceWidth - clampedX);
    const clampedHeight = Math.min(Math.abs(scaledHeight), sourceHeight - clampedY);

    if (clampedWidth <= 0 || clampedHeight <= 0) {
      console.warn('Selection is outside canvas bounds');
      return null;
    }

    // Draw the selected area onto the extraction canvas
    ctx.drawImage(
      sourceCanvas,
      clampedX,
      clampedY,
      clampedWidth,
      clampedHeight, // Source rectangle
      0,
      0,
      clampedWidth,
      clampedHeight // Destination rectangle
    );

    // Convert to data URL
    return extractionCanvas.toDataURL('image/png', 1.0);
  } catch (error) {
    console.error('Error extracting selection from canvas:', error);
    return null;
  }
};

/**
 * Find the PDF canvas element within a container
 */
export const findPDFCanvas = (container: HTMLElement): HTMLCanvasElement | null => {
  // Look for a canvas that's likely the PDF canvas
  const canvases = container.querySelectorAll('canvas');

  // Find the canvas that's not our selection overlay (doesn't have selection-canvas test id)
  for (const canvas of canvases) {
    if (!canvas.getAttribute('data-testid')?.includes('selection-canvas')) {
      return canvas as HTMLCanvasElement;
    }
  }

  // Fallback: return the first canvas if no specific one found
  return (canvases[0] as HTMLCanvasElement) || null;
};

/**
 * Extract selection image with automatic canvas discovery
 */
export const extractSelectionImage = (
  containerElement: HTMLElement,
  selection: NormalizedSelection
): string | null => {
  const pdfCanvas = findPDFCanvas(containerElement);

  if (!pdfCanvas) {
    console.error('Could not find PDF canvas element');
    return null;
  }

  return extractSelectionFromCanvas(pdfCanvas, selection, selection.scale);
};
