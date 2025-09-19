import { useEffect } from 'react';

export interface PDFZoomControlsProps {
  scale: number;
  hasDocument: boolean;
  onScaleChange: (scale: number | 'fit-width') => void;
  className?: string;
  style?: React.CSSProperties;
}

const ZOOM_STEP = 0.25;
const MIN_SCALE = 0.25;
const MAX_SCALE = 3;

const PRESET_SCALES = [
  { value: 0.5, label: '50%' },
  { value: 0.75, label: '75%' },
  { value: 1, label: '100%' },
  { value: 1.25, label: '125%' },
  { value: 1.5, label: '150%' },
  { value: 2, label: '200%' },
  { value: 3, label: '300%' },
];

export function PDFZoomControls({
  scale,
  hasDocument,
  onScaleChange,
  className,
  style,
}: PDFZoomControlsProps) {
  const zoomPercentage = Math.round(scale * 100);
  const canZoomOut = hasDocument && scale > MIN_SCALE;
  const canZoomIn = hasDocument && scale < MAX_SCALE;

  const handleZoomOut = () => {
    if (canZoomOut) {
      const newScale = Math.max(MIN_SCALE, scale - ZOOM_STEP);
      onScaleChange(newScale);
    }
  };

  const handleZoomIn = () => {
    if (canZoomIn) {
      const newScale = Math.min(MAX_SCALE, scale + ZOOM_STEP);
      onScaleChange(newScale);
    }
  };

  const handleActualSize = () => {
    if (hasDocument) {
      onScaleChange(1.0);
    }
  };

  const handleFitToWidth = () => {
    if (hasDocument) {
      onScaleChange('fit-width');
    }
  };

  const handlePresetChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    if (value === 'fit-width') {
      onScaleChange('fit-width');
    } else if (value !== 'custom') {
      onScaleChange(parseFloat(value));
    }
  };

  // Find current preset or mark as custom
  const currentPreset = PRESET_SCALES.find(preset => Math.abs(preset.value - scale) < 0.01);
  const selectValue = currentPreset ? currentPreset.value.toString() : 'custom';

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!hasDocument || !event.ctrlKey) return;

      switch (event.key) {
        case '=':
        case '+':
          event.preventDefault();
          handleZoomIn();
          break;
        case '-':
          event.preventDefault();
          handleZoomOut();
          break;
        case '0':
          event.preventDefault();
          handleActualSize();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasDocument, scale]); // change in scale will cause a rerender -> new handleZoomIn, handleZoomOut, handleActualSize functions created with the updated scale value

  return (
    <div className={className} style={style}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          type="button"
          onClick={handleZoomOut}
          disabled={!canZoomOut}
          aria-label="Zoom out"
          title="Zoom out (Ctrl+-)"
          style={{
            padding: '4px 8px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            background: !canZoomOut ? '#f5f5f5' : 'white',
            cursor: !canZoomOut ? 'not-allowed' : 'pointer',
            color: '#a59f9fff',
          }}
        >
          −
        </button>

        <select
          value={selectValue}
          onChange={handlePresetChange}
          disabled={!hasDocument}
          aria-label="Zoom level"
          style={{
            padding: '4px 8px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            background: !hasDocument ? '#f5f5f5' : 'white',
            cursor: !hasDocument ? 'not-allowed' : 'pointer',
            minWidth: '80px',
            color: '#a59f9fff',
          }}
        >
          {PRESET_SCALES.map(preset => (
            <option key={preset.value} value={preset.value}>
              {preset.label}
            </option>
          ))}
          <option value="fit-width">Fit Width</option>
          {selectValue === 'custom' && <option value="custom">{zoomPercentage}%</option>}
        </select>

        <button
          type="button"
          onClick={handleZoomIn}
          disabled={!canZoomIn}
          aria-label="Zoom in"
          title="Zoom in (Ctrl++)"
          style={{
            padding: '4px 8px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            background: !canZoomIn ? '#f5f5f5' : 'white',
            cursor: !canZoomIn ? 'not-allowed' : 'pointer',
            color: '#a59f9fff',
          }}
        >
          +
        </button>

        <button
          type="button"
          onClick={handleActualSize}
          disabled={!hasDocument}
          aria-label="Actual size"
          title="Actual size (Ctrl+0)"
          style={{
            padding: '4px 8px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            background: !hasDocument ? '#f5f5f5' : 'white',
            cursor: !hasDocument ? 'not-allowed' : 'pointer',
            color: '#a59f9fff',
          }}
        >
          100%
        </button>

        <button
          type="button"
          onClick={handleFitToWidth}
          disabled={!hasDocument}
          aria-label="Fit to width"
          title="Fit to width"
          style={{
            padding: '4px 8px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            background: !hasDocument ? '#f5f5f5' : 'white',
            cursor: !hasDocument ? 'not-allowed' : 'pointer',
            color: '#a59f9fff',
          }}
        >
          Fit Width
        </button>
      </div>

      {/* Screen reader announcement */}
      <div role="status" aria-live="polite" style={{ position: 'absolute', left: '-9999px' }}>
        Zoom: {zoomPercentage}%
      </div>
    </div>
  );
}
