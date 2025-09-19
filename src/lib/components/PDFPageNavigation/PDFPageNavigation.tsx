import { useState, useEffect } from 'react';

export interface PDFPageNavigationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
  style?: React.CSSProperties;
}

export function PDFPageNavigation({
  currentPage,
  totalPages,
  onPageChange,
  className,
  style,
}: PDFPageNavigationProps) {
  const [inputValue, setInputValue] = useState(currentPage.toString());

  // Sync input value with current page prop
  useEffect(() => {
    setInputValue(currentPage.toString());
  }, [currentPage]);

  const isFirstPage = currentPage <= 1;
  const isLastPage = currentPage >= totalPages;
  const hasDocument = totalPages > 0;

  const handlePreviousPage = () => {
    if (!isFirstPage) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (!isLastPage) {
      onPageChange(currentPage + 1);
    }
  };

  const validateAndSetPage = (value: string) => {
    const pageNumber = parseInt(value, 10);

    if (isNaN(pageNumber) || pageNumber < 1 || pageNumber > totalPages || value === '') {
      // Invalid input - revert to current page
      setInputValue(currentPage.toString());
      return;
    }

    if (pageNumber !== currentPage) {
      onPageChange(pageNumber);
    }
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value);
  };

  const handleInputBlur = () => {
    validateAndSetPage(inputValue);
  };

  const handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      validateAndSetPage(inputValue);
    } else if (event.key === 'ArrowUp' && currentPage < totalPages) {
      onPageChange(currentPage + 1);
    } else if (event.key === 'ArrowDown' && currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  return (
    <div className={className} style={style}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          type="button"
          onClick={handlePreviousPage}
          disabled={!hasDocument || isFirstPage}
          aria-label="Previous page"
          style={{
            padding: '4px 8px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            background: !hasDocument || isFirstPage ? '#f5f5f5' : 'white',
            cursor: !hasDocument || isFirstPage ? 'not-allowed' : 'pointer',
            color: '#a59f9fff',
          }}
        >
          ‹
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <label htmlFor="page-input" style={{ display: 'none' }}>
            Current page
          </label>
          <input
            id="page-input"
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            onKeyDown={handleInputKeyDown}
            disabled={!hasDocument}
            aria-label="Current page"
            style={{
              width: '50px',
              padding: '4px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              textAlign: 'center',
              background: !hasDocument ? '#f5f5f5' : 'white',
              color: '#a59f9fff',
            }}
          />
          <span>of {totalPages}</span>
        </div>

        <button
          type="button"
          onClick={handleNextPage}
          disabled={!hasDocument || isLastPage}
          aria-label="Next page"
          style={{
            padding: '4px 8px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            background: !hasDocument || isLastPage ? '#f5f5f5' : 'white',
            cursor: !hasDocument || isLastPage ? 'not-allowed' : 'pointer',
            color: '#a59f9fff',
          }}
        >
          ›
        </button>
      </div>

      {/* Screen reader announcement */}
      <div role="status" aria-live="polite" style={{ position: 'absolute', left: '-9999px' }}>
        Page {currentPage} of {totalPages}
      </div>
    </div>
  );
}
