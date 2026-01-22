// Set all required environment variables before env validation
// This must happen before any imports that use env.ts
process.env.NODE_ENV = 'test'
// Always use test database URL in test environment, overriding .env file
process.env.DATABASE_URL = 'postgresql://localhost/test'
process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'test-openai-key'
process.env.ENCRYPTION_KEY =
  process.env.ENCRYPTION_KEY || '0000000000000000000000000000000000000000000000000000000000000000'
// Better Auth configuration for tests
process.env.BETTER_AUTH_SECRET =
  process.env.BETTER_AUTH_SECRET || 'test-secret-key-that-is-at-least-32-characters-long'
process.env.BETTER_AUTH_URL = process.env.BETTER_AUTH_URL || 'http://localhost:3000'
process.env.BETTER_AUTH_TRUSTED_ORIGINS = process.env.BETTER_AUTH_TRUSTED_ORIGINS || ''
// Email configuration for tests
process.env.RESEND_API_KEY = process.env.RESEND_API_KEY || 're_test_key'
process.env.EMAIL_FROM = process.env.EMAIL_FROM || 'test@example.com'
process.env.EMAIL_FROM_NAME = process.env.EMAIL_FROM_NAME || 'Test App'

// Dynamic env vars are passed from CI secrets if available
// They're optional and will be undefined if not provided

import { logger } from '@repo/utils/logger'
import { afterAll, beforeAll } from 'vitest'
import { runMigrations } from './src/db/migrate.js'
import { closeTestDatabase, getTestDatabase } from './test/utils/db.js'

beforeAll(async () => {
  await getTestDatabase()

  // Run migrations if they exist
  // Errors are logged and rethrown to fail tests on migration regressions
  try {
    await runMigrations({
      info: (msg: string) => logger.info({ migration: true }, msg),
      error: (msg: string, err?: unknown) => logger.error({ migration: true, error: err }, msg),
    })
  } catch (err) {
    logger.error({ migration: true, error: err }, 'Migration failed')
    throw err
  }

  // Migrations handle all table creation and updates
  // No fallback SQL needed - migrations are the source of truth
})

afterAll(async () => {
  await closeTestDatabase()
})
