import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PDFZoomControls } from './PDFZoomControls';

describe('PDFZoomControls', () => {
  const mockOnScaleChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('should render disabled state when no document', () => {
      render(<PDFZoomControls scale={1} hasDocument={false} onScaleChange={mockOnScaleChange} />);

      expect(screen.getByRole('button', { name: /zoom out/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /zoom in/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /fit to width/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /actual size/i })).toBeDisabled();
    });

    it('should display current zoom percentage in dropdown', () => {
      render(<PDFZoomControls scale={1.5} hasDocument={true} onScaleChange={mockOnScaleChange} />);

      const select = screen.getByRole('combobox', { name: /zoom level/i });
      expect(select).toHaveValue('1.5');
    });

    it('should round zoom percentage to nearest integer for custom values', () => {
      render(
        <PDFZoomControls scale={1.337} hasDocument={true} onScaleChange={mockOnScaleChange} />
      );

      const select = screen.getByRole('combobox', { name: /zoom level/i });
      expect(select).toHaveValue('custom');
      expect(screen.getByText('134%')).toBeInTheDocument(); // In the custom option
    });
  });

  describe('zoom controls', () => {
    it('should disable zoom out at minimum scale', () => {
      render(<PDFZoomControls scale={0.25} hasDocument={true} onScaleChange={mockOnScaleChange} />);

      expect(screen.getByRole('button', { name: /zoom out/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /zoom in/i })).toBeEnabled();
    });

    it('should disable zoom in at maximum scale', () => {
      render(<PDFZoomControls scale={3} hasDocument={true} onScaleChange={mockOnScaleChange} />);

      expect(screen.getByRole('button', { name: /zoom out/i })).toBeEnabled();
      expect(screen.getByRole('button', { name: /zoom in/i })).toBeDisabled();
    });

    it('should enable both buttons at normal scales', () => {
      render(<PDFZoomControls scale={1} hasDocument={true} onScaleChange={mockOnScaleChange} />);

      expect(screen.getByRole('button', { name: /zoom out/i })).toBeEnabled();
      expect(screen.getByRole('button', { name: /zoom in/i })).toBeEnabled();
    });
  });

  describe('zoom actions', () => {
    it('should call onScaleChange when clicking zoom out', () => {
      render(<PDFZoomControls scale={1} hasDocument={true} onScaleChange={mockOnScaleChange} />);

      fireEvent.click(screen.getByRole('button', { name: /zoom out/i }));
      expect(mockOnScaleChange).toHaveBeenCalledWith(0.75);
    });

    it('should call onScaleChange when clicking zoom in', () => {
      render(<PDFZoomControls scale={1} hasDocument={true} onScaleChange={mockOnScaleChange} />);

      fireEvent.click(screen.getByRole('button', { name: /zoom in/i }));
      expect(mockOnScaleChange).toHaveBeenCalledWith(1.25);
    });

    it('should call onScaleChange with 1.0 when clicking actual size', () => {
      render(<PDFZoomControls scale={1.5} hasDocument={true} onScaleChange={mockOnScaleChange} />);

      fireEvent.click(screen.getByRole('button', { name: /actual size/i }));
      expect(mockOnScaleChange).toHaveBeenCalledWith(1.0);
    });

    it('should call onScaleChange with "fit-width" when clicking fit to width', () => {
      render(<PDFZoomControls scale={1} hasDocument={true} onScaleChange={mockOnScaleChange} />);

      fireEvent.click(screen.getByRole('button', { name: /fit to width/i }));
      expect(mockOnScaleChange).toHaveBeenCalledWith('fit-width');
    });
  });

  describe('preset zoom levels', () => {
    it('should provide dropdown with common zoom levels', () => {
      render(<PDFZoomControls scale={1} hasDocument={true} onScaleChange={mockOnScaleChange} />);

      const select = screen.getByRole('combobox', { name: /zoom level/i });
      expect(select).toBeInTheDocument();
    });

    it('should call onScaleChange when selecting preset zoom', () => {
      render(<PDFZoomControls scale={1} hasDocument={true} onScaleChange={mockOnScaleChange} />);

      const select = screen.getByRole('combobox', { name: /zoom level/i });
      fireEvent.change(select, { target: { value: '2' } });
      expect(mockOnScaleChange).toHaveBeenCalledWith(2);
    });

    it('should show current scale in dropdown when it matches preset', () => {
      render(<PDFZoomControls scale={1.5} hasDocument={true} onScaleChange={mockOnScaleChange} />);

      const select = screen.getByRole('combobox', { name: /zoom level/i });
      expect(select).toHaveValue('1.5');
    });

    it('should show custom option when scale does not match preset', () => {
      render(
        <PDFZoomControls scale={1.337} hasDocument={true} onScaleChange={mockOnScaleChange} />
      );

      const select = screen.getByRole('combobox', { name: /zoom level/i });
      expect(select).toHaveValue('custom');
    });
  });

  describe('keyboard shortcuts', () => {
    it('should handle keyboard events for zoom shortcuts', () => {
      render(
        <div>
          <PDFZoomControls scale={1} hasDocument={true} onScaleChange={mockOnScaleChange} />
        </div>
      );

      // Simulate Ctrl++ for zoom in
      fireEvent.keyDown(document, { key: '=', ctrlKey: true });
      expect(mockOnScaleChange).toHaveBeenCalledWith(1.25);

      // Simulate Ctrl+- for zoom out
      fireEvent.keyDown(document, { key: '-', ctrlKey: true });
      expect(mockOnScaleChange).toHaveBeenCalledWith(0.75);

      // Simulate Ctrl+0 for actual size
      fireEvent.keyDown(document, { key: '0', ctrlKey: true });
      expect(mockOnScaleChange).toHaveBeenCalledWith(1.0);
    });

    it('should not trigger zoom when modifier keys are not pressed', () => {
      render(<PDFZoomControls scale={1} hasDocument={true} onScaleChange={mockOnScaleChange} />);

      fireEvent.keyDown(document, { key: '=' });
      fireEvent.keyDown(document, { key: '-' });
      fireEvent.keyDown(document, { key: '0' });

      expect(mockOnScaleChange).not.toHaveBeenCalled();
    });
  });

  describe('accessibility', () => {
    it('should have proper ARIA labels for all controls', () => {
      render(<PDFZoomControls scale={1} hasDocument={true} onScaleChange={mockOnScaleChange} />);

      expect(screen.getByRole('button', { name: /zoom out/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /zoom in/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /actual size/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /fit to width/i })).toBeInTheDocument();
      expect(screen.getByRole('combobox', { name: /zoom level/i })).toBeInTheDocument();
    });

    it('should announce zoom level changes to screen readers', () => {
      render(<PDFZoomControls scale={1.5} hasDocument={true} onScaleChange={mockOnScaleChange} />);

      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.getByText(/zoom: 150%/i)).toBeInTheDocument();
    });
  });

  describe('boundaries and validation', () => {
    it('should not allow zoom below minimum scale', () => {
      render(<PDFZoomControls scale={0.3} hasDocument={true} onScaleChange={mockOnScaleChange} />);

      fireEvent.click(screen.getByRole('button', { name: /zoom out/i }));
      expect(mockOnScaleChange).toHaveBeenCalledWith(0.25); // Should clamp to minimum
    });

    it('should not allow zoom above maximum scale', () => {
      render(<PDFZoomControls scale={2.8} hasDocument={true} onScaleChange={mockOnScaleChange} />);

      fireEvent.click(screen.getByRole('button', { name: /zoom in/i }));
      expect(mockOnScaleChange).toHaveBeenCalledWith(3); // Should clamp to maximum
    });
  });
});
