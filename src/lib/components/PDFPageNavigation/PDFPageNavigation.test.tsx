import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PDFPageNavigation } from './PDFPageNavigation';

describe('PDFPageNavigation', () => {
  const mockOnPageChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('should render disabled state when no document', () => {
      render(<PDFPageNavigation currentPage={1} totalPages={0} onPageChange={mockOnPageChange} />);

      expect(screen.getByRole('button', { name: /previous page/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /next page/i })).toBeDisabled();
      expect(screen.getByDisplayValue('1')).toBeDisabled();
    });

    it('should render page information correctly', () => {
      render(<PDFPageNavigation currentPage={2} totalPages={5} onPageChange={mockOnPageChange} />);

      expect(screen.getByDisplayValue('2')).toBeInTheDocument();
      expect(screen.getByText('of 5')).toBeInTheDocument();
    });
  });

  describe('navigation buttons', () => {
    it('should disable previous button on first page', () => {
      render(<PDFPageNavigation currentPage={1} totalPages={5} onPageChange={mockOnPageChange} />);

      expect(screen.getByRole('button', { name: /previous page/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /next page/i })).toBeEnabled();
    });

    it('should disable next button on last page', () => {
      render(<PDFPageNavigation currentPage={5} totalPages={5} onPageChange={mockOnPageChange} />);

      expect(screen.getByRole('button', { name: /previous page/i })).toBeEnabled();
      expect(screen.getByRole('button', { name: /next page/i })).toBeDisabled();
    });

    it('should enable both buttons on middle pages', () => {
      render(<PDFPageNavigation currentPage={3} totalPages={5} onPageChange={mockOnPageChange} />);

      expect(screen.getByRole('button', { name: /previous page/i })).toBeEnabled();
      expect(screen.getByRole('button', { name: /next page/i })).toBeEnabled();
    });
  });

  describe('navigation actions', () => {
    it('should call onPageChange when clicking previous button', () => {
      render(<PDFPageNavigation currentPage={3} totalPages={5} onPageChange={mockOnPageChange} />);

      fireEvent.click(screen.getByRole('button', { name: /previous page/i }));
      expect(mockOnPageChange).toHaveBeenCalledWith(2);
    });

    it('should call onPageChange when clicking next button', () => {
      render(<PDFPageNavigation currentPage={3} totalPages={5} onPageChange={mockOnPageChange} />);

      fireEvent.click(screen.getByRole('button', { name: /next page/i }));
      expect(mockOnPageChange).toHaveBeenCalledWith(4);
    });

    it('should call onPageChange when entering valid page number', () => {
      render(<PDFPageNavigation currentPage={3} totalPages={5} onPageChange={mockOnPageChange} />);

      const pageInput = screen.getByDisplayValue('3');
      fireEvent.change(pageInput, { target: { value: '4' } });
      fireEvent.blur(pageInput);

      expect(mockOnPageChange).toHaveBeenCalledWith(4);
    });

    it('should call onPageChange when pressing Enter in page input', () => {
      render(<PDFPageNavigation currentPage={3} totalPages={5} onPageChange={mockOnPageChange} />);

      const pageInput = screen.getByDisplayValue('3');
      fireEvent.change(pageInput, { target: { value: '2' } });
      fireEvent.keyDown(pageInput, { key: 'Enter' });

      expect(mockOnPageChange).toHaveBeenCalledWith(2);
    });
  });

  describe('input validation', () => {
    it('should reject invalid page numbers (too low)', () => {
      render(<PDFPageNavigation currentPage={3} totalPages={5} onPageChange={mockOnPageChange} />);

      const pageInput = screen.getByDisplayValue('3');
      fireEvent.change(pageInput, { target: { value: '0' } });
      fireEvent.blur(pageInput);

      expect(mockOnPageChange).not.toHaveBeenCalled();
      expect(screen.getByDisplayValue('3')).toBeInTheDocument(); // Should revert
    });

    it('should reject invalid page numbers (too high)', () => {
      render(<PDFPageNavigation currentPage={3} totalPages={5} onPageChange={mockOnPageChange} />);

      const pageInput = screen.getByDisplayValue('3');
      fireEvent.change(pageInput, { target: { value: '10' } });
      fireEvent.blur(pageInput);

      expect(mockOnPageChange).not.toHaveBeenCalled();
      expect(screen.getByDisplayValue('3')).toBeInTheDocument(); // Should revert
    });

    it('should reject non-numeric input', () => {
      render(<PDFPageNavigation currentPage={3} totalPages={5} onPageChange={mockOnPageChange} />);

      const pageInput = screen.getByDisplayValue('3');
      fireEvent.change(pageInput, { target: { value: 'abc' } });
      fireEvent.blur(pageInput);

      expect(mockOnPageChange).not.toHaveBeenCalled();
      expect(screen.getByDisplayValue('3')).toBeInTheDocument(); // Should revert
    });

    it('should handle empty input gracefully', () => {
      render(<PDFPageNavigation currentPage={3} totalPages={5} onPageChange={mockOnPageChange} />);

      const pageInput = screen.getByDisplayValue('3');
      fireEvent.change(pageInput, { target: { value: '' } });
      fireEvent.blur(pageInput);

      expect(mockOnPageChange).not.toHaveBeenCalled();
      expect(screen.getByDisplayValue('3')).toBeInTheDocument(); // Should revert
    });
  });

  describe('keyboard navigation', () => {
    it('should support arrow key navigation', () => {
      render(<PDFPageNavigation currentPage={3} totalPages={5} onPageChange={mockOnPageChange} />);

      const pageInput = screen.getByDisplayValue('3');

      // Arrow up should go to next page
      fireEvent.keyDown(pageInput, { key: 'ArrowUp' });
      expect(mockOnPageChange).toHaveBeenCalledWith(4);

      // Arrow down should go to previous page
      fireEvent.keyDown(pageInput, { key: 'ArrowDown' });
      expect(mockOnPageChange).toHaveBeenCalledWith(2);
    });

    it('should respect page boundaries with arrow keys', () => {
      render(<PDFPageNavigation currentPage={1} totalPages={5} onPageChange={mockOnPageChange} />);

      const pageInput = screen.getByDisplayValue('1');

      // Arrow down on first page should do nothing
      fireEvent.keyDown(pageInput, { key: 'ArrowDown' });
      expect(mockOnPageChange).not.toHaveBeenCalled();
    });
  });

  describe('accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<PDFPageNavigation currentPage={3} totalPages={5} onPageChange={mockOnPageChange} />);

      expect(screen.getByLabelText(/current page/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /previous page/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /next page/i })).toBeInTheDocument();
    });

    it('should announce page changes to screen readers', () => {
      render(<PDFPageNavigation currentPage={3} totalPages={5} onPageChange={mockOnPageChange} />);

      // Check for aria-live region
      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.getByText(/page 3 of 5/i)).toBeInTheDocument();
    });
  });
});
