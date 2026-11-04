import { defineConfig, devices } from '@playwright/test';
import baseConfig from './playwright.config';

/** README screenshots: run with `npm run screenshots` (never part of `npm run e2e` or CI). */
export default defineConfig({
  testDir: 'e2e/screenshots',
  testMatch: '*.ts',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: 'list',
  use: baseConfig.use,
  projects: [{ name: 'screenshots', use: { ...devices['Pixel 7'] } }],
  webServer: baseConfig.webServer,
});
