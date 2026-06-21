import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/__tests__/setup.ts'],
    // Coverage enabled per audit. Run with --coverage. Thresholds enforced in CI.
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary', 'html'],
      exclude: ['src/__tests__/**', 'node_modules/**', 'dist/**'],
      thresholds: { lines: 80, functions: 75, branches: 70, statements: 80 },
    },
  },
});
