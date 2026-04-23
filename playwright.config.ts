import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [['html', { open: 'never' }]],
  globalSetup: './e2e/global-setup.ts',
  use: {
    baseURL: 'http://localhost:5174',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    {
      command: 'bun --env-file .env.test src/index.ts',
      cwd: './server',
      port: 3001,
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
    {
      command: 'bun dev --port 5174',
      cwd: './client',
      port: 5174,
      env: {
        VITE_API_URL: 'http://localhost:3001',
      },
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
  ],
});
