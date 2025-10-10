import { useRef, useEffect, useState } from 'react';

interface SelectionCanvasProps {
  width: number;
  height: number;
  isActive: boolean;
  onSelectionStart?: (coords: { x: number; y: number }) => void;
  onSelectionUpdate?: (selection: {
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
    width: number;
    height: number;
  }) => void;
  onSelectionComplete?: () => void;
  selectionColor?: string;
}

export const SelectionCanvas = ({
  width,
  height,
  isActive,
  onSelectionStart,
  onSelectionUpdate,
  onSelectionComplete,
  selectionColor = '#0066cc',
}: SelectionCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [startCoords, setStartCoords] = useState<{ x: number; y: number } | null>(null);

  const handleMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isActive) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    setIsSelecting(true);
    setStartCoords({ x, y });
    onSelectionStart?.({ x, y });
  };

  const handleMouseMove = (event: MouseEvent) => {
    if (!isSelecting || !startCoords || !isActive) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const currentX = event.clientX - rect.left;
    const currentY = event.clientY - rect.top;

    // Clear canvas
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, width, height);

      // Draw selection rectangle
      ctx.strokeStyle = selectionColor;
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);

      const rectWidth = currentX - startCoords.x;
      const rectHeight = currentY - startCoords.y;

      ctx.strokeRect(startCoords.x, startCoords.y, rectWidth, rectHeight);

      onSelectionUpdate?.({
        startX: startCoords.x,
        startY: startCoords.y,
        currentX,
        currentY,
        width: rectWidth,
        height: rectHeight,
      });
    }
  };

  const handleMouseUp = () => {
    if (!isSelecting || !startCoords || !isActive) return;
    onSelectionComplete?.();
    setIsSelecting(false);
    setStartCoords(null);
  };

  // Set up global mouse event listeners
  useEffect(() => {
    if (isSelecting) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSelecting, startCoords, isActive]);

  return (
    <canvas
      ref={canvasRef}
      data-testid="selection-canvas"
      width={width}
      height={height}
      onMouseDown={handleMouseDown}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        pointerEvents: isActive ? 'auto' : 'none',
        cursor: isActive ? 'crosshair' : 'default',
      }}
    />
  );
};
