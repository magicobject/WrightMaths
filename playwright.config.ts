import { defineConfig, devices } from '@playwright/test';

// Several Claude sessions can test different worktrees at once: set WM_TEST_PORT to avoid reusing another worktree's server.
const PORT = Number(process.env.WM_TEST_PORT ?? 4173);

export default defineConfig({
  testDir: './test',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: `npx tsx test/support/static-server.ts`,
    env: { PORT: String(PORT) },
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
