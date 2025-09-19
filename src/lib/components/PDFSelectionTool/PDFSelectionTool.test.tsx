import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PDFSelectionTool } from './index';

describe('PDFSelectionTool', () => {
  it('renders the component with basic UI', () => {
    const mockOnSelectionComplete = vi.fn();

    render(<PDFSelectionTool onSelectionComplete={mockOnSelectionComplete} />);

    expect(screen.getByText('PDF Selection Tool')).toBeInTheDocument();
    expect(screen.getByText(/placeholder component/i)).toBeInTheDocument();
  });

  it('displays PDF file name when provided', () => {
    const mockFile = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
    const mockOnSelectionComplete = vi.fn();

    render(<PDFSelectionTool pdfFile={mockFile} onSelectionComplete={mockOnSelectionComplete} />);

    expect(screen.getByText('PDF File: test.pdf')).toBeInTheDocument();
  });

  it('displays PDF URL when provided', () => {
    const testUrl = 'https://example.com/test.pdf';
    const mockOnSelectionComplete = vi.fn();

    render(<PDFSelectionTool pdfUrl={testUrl} onSelectionComplete={mockOnSelectionComplete} />);

    expect(screen.getByText(`PDF URL: ${testUrl}`)).toBeInTheDocument();
  });
});
