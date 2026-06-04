import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/__tests__/setup.ts'],
    // Scope to src/ only (avoids picking up e2e/ playwright specs, functions/ node_modules tests, etc.)
    include: ['src/**/*.{test,spec}.?(c|m)[jt]s?(x)'],
    exclude: ['node_modules', 'dist'],
  },
});
