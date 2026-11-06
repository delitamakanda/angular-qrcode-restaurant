import { defineConfig, devices } from '@playwright/test';
import baseConfig from './playwright.config';

/** README demo video: run with `npm run demo` (never part of `npm run e2e` or CI). */
export default defineConfig({
  testDir: 'e2e/demo',
  testMatch: '*.ts',
  outputDir: 'test-results/demo',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: 'list',
  use: { ...baseConfig.use, video: { mode: 'on', size: { width: 412, height: 915 } } },
  projects: [{ name: 'demo', use: { ...devices['Pixel 7'] } }],
  webServer: baseConfig.webServer,
});
