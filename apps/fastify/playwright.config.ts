import { defineConfig, devices } from '@playwright/test'

const isCi = !!process.env.CI
const htmlReportOpenEnv = process.env.PLAYWRIGHT_HTML_REPORT_OPEN
const htmlReportOpen =
  htmlReportOpenEnv === 'always' ||
  htmlReportOpenEnv === 'never' ||
  htmlReportOpenEnv === 'on-failure'
    ? htmlReportOpenEnv
    : 'never'

export default defineConfig({
  testDir: './test',
  testMatch: /.*\.e2e\.spec\.ts$/,
  fullyParallel: true,
  forbidOnly: isCi,
  retries: isCi ? 2 : 0,
  workers: isCi ? 1 : undefined,
  reporter: isCi ? 'github' : [['html', { open: htmlReportOpen }]],
  use: {
    baseURL: process.env.PLAYWRIGHT_API_URL || 'http://localhost:3001',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'pnpm start:ci',
    url: 'http://localhost:3001/health',
    reuseExistingServer: !isCi,
    timeout: 120000,
    env: {
      USE_FAKE_EMAIL: 'true',
      PGLITE: 'true',
    },
  },
})
