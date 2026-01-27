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
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: isCi,
  retries: isCi ? 2 : 0,
  workers: isCi ? 1 : undefined,
  reporter: isCi ? 'github' : [['html', { open: htmlReportOpen }]],
  use: {
    baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    {
      command: isCi ? 'pnpm --filter @repo/fastify start:ci' : 'pnpm --filter @repo/fastify dev',
      url: 'http://localhost:3001/health',
      reuseExistingServer: !isCi,
      timeout: 120000,
      env: {
        USE_FAKE_EMAIL: 'true',
        PGLITE: 'true',
      },
    },
    {
      command: `PORT=${process.env.PORT || '3000'} pnpm start`,
      url: process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000',
      reuseExistingServer: !isCi,
      timeout: 120000,
    },
  ],
})
