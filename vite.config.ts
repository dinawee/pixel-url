import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// Demo application configuration
export default defineConfig({
  plugins: [react()],
  root: 'src/demo',
  build: {
    outDir: '../../dist-demo',
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@pixel-url/core': path.resolve(__dirname, 'src/lib'),
      '@': path.resolve(__dirname, 'src/demo'),
    },
  },
  server: {
    port: 3000,
    open: true,
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
  },
  optimizeDeps: {
    include: ['pdfjs-dist'],
    exclude: ['pdfjs-dist/build/pdf.worker.js'],
  },
});
