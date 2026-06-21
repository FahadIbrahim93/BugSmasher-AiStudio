import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/__tests__/setup.ts'],
    // Coverage ready (requires `npm i -D @vitest/coverage-v8` when deps healthy)
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary', 'html'],
      exclude: ['src/__tests__/**', 'node_modules/**', 'dist/**'],
      thresholds: { lines: 80, functions: 75, branches: 70, statements: 80 },
    },
  },
});
