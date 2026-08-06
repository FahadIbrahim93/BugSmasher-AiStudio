import { defineConfig, devices } from '@playwright/test';

/**
 * Browser E2E suite — validates the BUILT app (dist/) exactly as shipped.
 *
 * Run `npm run build` first (or reuse the CI build artifact via
 * actions/download-artifact), then `npx playwright test`.
 * The `test:e2e` npm script chains the build for local one-shot runs.
 */
export default defineConfig({
  testDir: './e2e',
  // `.e2e.ts` keeps these out of vitest (which includes `src/**/*.test.{ts,tsx}`)
  testMatch: /.*\.e2e\.ts/,
  timeout: 300_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'npm run preview -- --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
