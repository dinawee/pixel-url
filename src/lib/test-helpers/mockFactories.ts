import { vi } from 'vitest';

export interface MockPDFPageOptions {
  viewport?: {
    width: number;
    height: number;
    scale: number;
    transform: number[];
  };
}

export interface MockPDFDocumentOptions {
  numPages?: number;
  getPage?: number;
}

export const createMockPDFPage = (options: MockPDFPageOptions = {}) => {
  const defaultViewport = {
    width: 800,
    height: 600,
    scale: 1,
    transform: [1, 0, 0, 1, 0, 0],
  };

  return {
    getViewport: vi.fn(({ scale = 1 }) => ({
      ...defaultViewport,
      ...options.viewport,
      width: (options.viewport?.width || defaultViewport.width) * scale,
      height: (options.viewport?.height || defaultViewport.height) * scale,
      scale,
    })),
    render: vi.fn().mockResolvedValue(undefined),
  };
};

export const createMockPDFDocument = (options: MockPDFDocumentOptions = {}) => {
  const mockPage = createMockPDFPage();

  return {
    numPages: options.numPages || 5,
    getPage: options.getPage || vi.fn().mockResolvedValue(mockPage),
    fingerprint: 'mock-fingerprint',
  };
};
