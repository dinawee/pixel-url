import { pdfjs } from 'react-pdf';

// Configure react-pdf worker to use matching version from CDN
const setupReactPDFWorker = () => {
  if (typeof window !== 'undefined' && !import.meta.env?.VITEST) {
    // Use CDN to ensure exact version match between API and worker
    pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
  }
};

setupReactPDFWorker();

export { setupReactPDFWorker };
