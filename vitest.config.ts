import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: ['node_modules', 'dist', 'dist-demo'],
    coverage: {
      include: ['src/lib/**/*.{ts,tsx}'],
      exclude: [
        'src/lib/**/*.d.ts',
        'src/lib/**/*.stories.tsx',
        'src/demo/**/*',
        'src/test-setup.ts',
      ],
      thresholds: {
        global: {
          lines: 90,
          functions: 90,
          branches: 85,
          statements: 90,
        },
        'src/lib/components/': {
          lines: 95,
          functions: 95,
        },
        'src/lib/hooks/': {
          lines: 95,
          functions: 95,
        },
      },
      reporter: ['text', 'json', 'html'],
    },
  },
  resolve: {
    alias: {
      '@pixel-url/core': path.resolve(__dirname, 'src/lib'),
      '@': path.resolve(__dirname, 'src/demo'),
    },
  },
});
