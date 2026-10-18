import { defineConfig, devices } from '@playwright/test';

const isCI = !!process.env['CI'];

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  reporter: isCI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: 'http://localhost:4200',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    {
      name: 'mobile',
      use: { ...devices['Pixel 7'] },
      testMatch: 'order-flow.spec.ts',
    },
  ],
  webServer: {
    command: 'npm run start:all',
    url: 'http://localhost:4200',
    // Les workflows agents démarrent déjà l'app (pour le MCP Playwright) : E2E_REUSE_SERVER=1.
    reuseExistingServer: !isCI || !!process.env['E2E_REUSE_SERVER'],
    timeout: 180_000,
  },
});
