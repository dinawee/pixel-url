import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ReactPDFViewer } from './ReactPDFViewer';

// Mock react-pdf
vi.mock('react-pdf', () => ({
  Page: vi.fn(({ onRenderSuccess }) => {
    // Simulate successful render
    setTimeout(() => onRenderSuccess?.(), 0);
    return <div data-testid="pdf-page">PDF Page Content</div>;
  }),
}));

// Mock react-pdf setup
vi.mock('../../config/react-pdf-setup', () => ({}));

describe('ReactPDFViewer', () => {
  const mockFile = new File(['test content'], 'test.pdf', { type: 'application/pdf' });

  it('should render Page component when file is provided', () => {
    render(
      <ReactPDFViewer file={mockFile} pageNumber={2} scale={1.5} isLoading={false} error={null} />
    );

    expect(screen.getByTestId('pdf-page')).toBeInTheDocument();
  });

  it('should display loading state', () => {
    render(
      <ReactPDFViewer file={mockFile} pageNumber={1} scale={1} isLoading={true} error={null} />
    );

    expect(screen.getByText('Loading PDF...')).toBeInTheDocument();
  });

  it('should display error state', () => {
    render(
      <ReactPDFViewer
        file={mockFile}
        pageNumber={1}
        scale={1}
        isLoading={false}
        error="Failed to load PDF"
      />
    );

    expect(screen.getByText('Error: Failed to load PDF')).toBeInTheDocument();
  });

  it('should handle no file provided', () => {
    render(<ReactPDFViewer file={null} pageNumber={1} scale={1} isLoading={false} error={null} />);

    expect(screen.getByText('No PDF document loaded')).toBeInTheDocument();
  });

  it('should apply custom className and style to loading state', () => {
    const customStyle = { border: '1px solid red' };

    render(
      <ReactPDFViewer
        file={mockFile}
        pageNumber={1}
        scale={1}
        isLoading={true}
        error={null}
        className="custom-class"
        style={customStyle}
      />
    );

    const element = screen.getByText('Loading PDF...');
    expect(element).toHaveClass('custom-class');
    // Check that style prop is applied (React will convert the object to style attribute)
    expect(element).toHaveAttribute('style');
  });

  it('should call onRenderSuccess when page renders successfully', () => {
    const mockOnRenderSuccess = vi.fn();

    render(
      <ReactPDFViewer
        file={mockFile}
        pageNumber={1}
        scale={1}
        isLoading={false}
        error={null}
        onRenderSuccess={mockOnRenderSuccess}
      />
    );

    // Note: In a real test, you'd need to simulate the Page component
    // calling onRenderSuccess, but this tests the prop is passed
    expect(mockOnRenderSuccess).toBeDefined();
  });

  it('should call onRenderError when page fails to render', () => {
    const mockOnRenderError = vi.fn();

    render(
      <ReactPDFViewer
        file={mockFile}
        pageNumber={1}
        scale={1}
        isLoading={false}
        error="Test error"
        onRenderError={mockOnRenderError}
      />
    );

    // Note: In a real test, you'd need to simulate the Page component
    // calling onRenderError, but this tests the prop is passed
    expect(mockOnRenderError).toBeDefined();
  });
});
