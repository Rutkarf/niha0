import { defineConfig, devices } from '@playwright/test';

/**
 * E2E smoke — expects frontend on :4200 (and backend on :8080 for @live tests).
 * Run: npx playwright test
 * Live stack: E2E_LIVE=1 npx playwright test
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  fullyParallel: false,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 1 : 0,
  reporter: 'list',
  use: {
    baseURL: process.env['E2E_BASE_URL'] ?? 'http://127.0.0.1:4200',
    trace: 'on-first-retry',
    locale: 'fr-FR',
  },
  webServer: {
    command: 'npm start -- --host 127.0.0.1 --port 4200',
    url: 'http://127.0.0.1:4200',
    reuseExistingServer: true,
    timeout: 180_000,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
