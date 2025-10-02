import { defineConfig, devices } from '@playwright/test';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '.env') });

const STORAGE_STATE = path.resolve(__dirname, 'e2e/.auth/admin.json');
const baseURL = process.env.E2E_BASE_URL || 'http://localhost:5173';
const headed = String(process.env.E2E_HEADED || '').toLowerCase() === 'true';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['json', { outputFile: path.resolve(__dirname, 'test-results', 'playwright-results.json') }],
  ],
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  globalSetup: path.resolve(__dirname, 'e2e/global-setup.ts'),
  use: {
    baseURL,
    storageState: STORAGE_STATE,
    trace: process.env.CI ? 'on-first-retry' : 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: process.env.CI ? 'retain-on-failure' : 'off',
    actionTimeout: 15_000,
    navigationTimeout: 20_000,
    viewport: { width: 1440, height: 900 },
    headless: !headed,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], storageState: STORAGE_STATE },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'], storageState: STORAGE_STATE },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'], storageState: STORAGE_STATE },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'], storageState: STORAGE_STATE },
    },
  ],
});