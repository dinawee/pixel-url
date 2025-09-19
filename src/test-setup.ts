import '@testing-library/jest-dom';

// Mock PDF.js worker
const mockWorkerSrc = 'mock-worker.js';

// Global mocks for tests
global.URL.createObjectURL = vi.fn(() => 'mock-url');
global.URL.revokeObjectURL = vi.fn();

// Canvas mock
const mockCanvas = {
  getContext: vi.fn(() => ({
    fillRect: vi.fn(),
    strokeRect: vi.fn(),
    clearRect: vi.fn(),
    drawImage: vi.fn(),
    getImageData: vi.fn(() => new ImageData(100, 100)),
    putImageData: vi.fn(),
    beginPath: vi.fn(),
    stroke: vi.fn(),
    fill: vi.fn(),
    setLineDash: vi.fn(),
  })),
  toDataURL: vi.fn(() => 'data:image/png;base64,mock-data'),
  width: 800,
  height: 600,
};

global.HTMLCanvasElement.prototype.getContext = mockCanvas.getContext;
global.HTMLCanvasElement.prototype.toDataURL = mockCanvas.toDataURL;

// PDF.js global worker setup mock
vi.mock('pdfjs-dist', () => ({
  GlobalWorkerOptions: {
    workerSrc: mockWorkerSrc,
  },
  getDocument: vi.fn(),
}));
