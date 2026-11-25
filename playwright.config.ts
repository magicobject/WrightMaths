import { defineConfig, devices } from '@playwright/test';

// Several Claude sessions can test different worktrees at once: set WM_TEST_PORT to avoid reusing another worktree's server.
// Without WM_TEST_PORT each checkout (worktree) gets its own port, worked out from its folder, so a test run
// never silently reuses another worktree's server and tests the wrong files.
const folderPort = 4200 + ([...__dirname].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7) % 700);
const PORT = Number(process.env.WM_TEST_PORT ?? folderPort);

export default defineConfig({
  testDir: './test',
  // The book has grown to over a hundred pages, and a few checks visit all of them: allow for a busy machine.
  timeout: 90_000,
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
    // Run tsx directly: `npx tsx` can spend a minute resolving the package (for example in a git worktree whose node_modules is a link),
    // which is longer than this server's start-up allowance below.
    command: 'node node_modules/tsx/dist/cli.mjs test/support/static-server.ts',
    env: { PORT: String(PORT) },
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
