import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PDFViewer, PDFPageNavigation, PDFZoomControls } from '../index';

// Mock PDF.js
vi.mock('pdfjs-dist', () => ({
  getDocument: vi.fn(),
  GlobalWorkerOptions: { workerSrc: 'mock-worker.js' },
}));

// Mock document for testing
const mockDocument = {
  numPages: 3,
  fingerprint: 'test-fingerprint',
  destroy: vi.fn(),
};

// Integration test component that combines all PDF viewer functionality
function IntegratedPDFViewer({ hasDocument = false }: { hasDocument?: boolean }) {
  return (
    <div>
      <PDFZoomControls scale={1.5} hasDocument={hasDocument} onScaleChange={() => {}} />

      {hasDocument && (
        <>
          <PDFPageNavigation currentPage={2} totalPages={3} onPageChange={() => {}} />

          <div data-testid="pdf-container">
            <PDFViewer
              document={mockDocument}
              isLoading={false}
              error={null}
              scale={1.5}
              pageNumber={2}
            />
          </div>
        </>
      )}
    </div>
  );
}

describe('PDF Viewer System Integration', () => {
  it('should render zoom controls without document', () => {
    render(<IntegratedPDFViewer hasDocument={false} />);

    // Zoom controls should be present but disabled
    expect(screen.getByLabelText('Zoom out')).toBeInTheDocument();
    expect(screen.getByLabelText('Zoom in')).toBeInTheDocument();
    expect(screen.getByLabelText('Fit to width')).toBeInTheDocument();

    // PDF container should not be present
    expect(screen.queryByTestId('pdf-container')).not.toBeInTheDocument();
  });

  it('should integrate all PDF viewer components when document is loaded', () => {
    render(<IntegratedPDFViewer hasDocument={true} />);

    // Zoom controls should be present
    expect(screen.getByLabelText('Zoom in')).toBeInTheDocument();
    expect(screen.getByLabelText('Zoom out')).toBeInTheDocument();
    expect(screen.getByText('150%')).toBeInTheDocument(); // Current scale in dropdown

    // Page navigation should be present - check for the input value
    expect(screen.getByDisplayValue('2')).toBeInTheDocument(); // Current page input
    expect(screen.getByText('of 3')).toBeInTheDocument(); // Total pages

    // PDF container should be present
    expect(screen.getByTestId('pdf-container')).toBeInTheDocument();
  });

  it('should maintain consistent state across components', () => {
    render(<IntegratedPDFViewer hasDocument={true} />);

    // All components should reflect the same document state
    expect(screen.getByText('150%')).toBeInTheDocument(); // Scale from zoom controls
    expect(screen.getByDisplayValue('2')).toBeInTheDocument(); // Current page
    expect(screen.getByText('of 3')).toBeInTheDocument(); // Total pages
    expect(screen.getByTestId('pdf-container')).toBeInTheDocument(); // Viewer container

    // Components should be properly integrated
    const zoomControls = screen.getByLabelText('Zoom in').closest('div');
    const pageNavigation = screen.getByDisplayValue('2').closest('div');
    const pdfContainer = screen.getByTestId('pdf-container');

    expect(zoomControls).toBeInTheDocument();
    expect(pageNavigation).toBeInTheDocument();
    expect(pdfContainer).toBeInTheDocument();
  });

  it('should handle component lifecycle properly', () => {
    const { rerender } = render(<IntegratedPDFViewer hasDocument={false} />);

    // Initially no PDF components
    expect(screen.queryByTestId('pdf-container')).not.toBeInTheDocument();
    expect(screen.queryByDisplayValue('2')).not.toBeInTheDocument();

    // After "loading" a document
    rerender(<IntegratedPDFViewer hasDocument={true} />);

    // All PDF components should appear
    expect(screen.getByTestId('pdf-container')).toBeInTheDocument();
    expect(screen.getByDisplayValue('2')).toBeInTheDocument();
  });

  it('should integrate components with proper accessibility', () => {
    render(<IntegratedPDFViewer hasDocument={true} />);

    // Check that components have proper accessibility attributes
    expect(screen.getByLabelText('Zoom in')).toBeInTheDocument();
    expect(screen.getByLabelText('Zoom out')).toBeInTheDocument();
    expect(screen.getByLabelText('Previous page')).toBeInTheDocument();
    expect(screen.getByLabelText('Next page')).toBeInTheDocument();
    expect(screen.getByLabelText('Current page')).toBeInTheDocument();

    // Check for screen reader announcements (live regions)
    expect(screen.getByText(/Zoom: 150%/)).toBeInTheDocument();
    expect(screen.getByText(/Page 2 of 3/)).toBeInTheDocument();
  });
});
