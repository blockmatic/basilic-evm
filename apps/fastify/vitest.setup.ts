/**
 * Vitest Test Setup
 *
 * Configures test environment and database lifecycle.
 *
 * ## Test Database Lifecycle
 *
 * Each test suite (`describe` block) gets a fresh PGLite in-memory database:
 *
 * 1. **beforeAll**: Creates a fresh database instance and runs migrations
 * 2. **Tests run**: Tests within the same suite can share state/data
 *    - Example: Create an account in one test, then test login in another
 * 3. **afterAll**: Deletes the database instance (ensures clean state for next suite)
 *
 * ## Important Notes
 *
 * - Tests should NOT depend on state from other test suites
 * - Each suite starts with a completely fresh database
 * - Database instance is deleted after suite completes (handles test failures too)
 * - No `afterEach` hook - data persists within a suite to allow test dependencies
 */

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
process.env.BETTER_AUTH_URL =
  process.env.BETTER_AUTH_URL || `http://localhost:${process.env.PORT || 3000}`
process.env.BETTER_AUTH_TRUSTED_ORIGINS = process.env.BETTER_AUTH_TRUSTED_ORIGINS || ''
// Email configuration for tests
process.env.RESEND_API_KEY = process.env.RESEND_API_KEY || 're_test_key'
process.env.EMAIL_FROM = process.env.EMAIL_FROM || 'test@example.com'
process.env.EMAIL_FROM_NAME = process.env.EMAIL_FROM_NAME || 'Test App'

// Dynamic env vars are passed from CI secrets if available
// They're optional and will be undefined if not provided

import { logger } from '@repo/utils/logger'
import { afterAll, beforeAll } from 'vitest'
import { resetDbInstance } from './src/db/index.js'
import { runMigrations } from './src/db/migrate.js'
import { closeTestDatabase, resetTestDatabase } from './test/utils/db.js'

beforeAll(async () => {
  // Create a fresh database instance for this test suite
  // This ensures each suite starts with a clean database
  await resetTestDatabase()

  // Run migrations to set up the schema
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

// No afterEach hook - tests can share state/data within a suite
// This allows tests to depend on each other (e.g., create account, then test login)
// Data is only cleared when the suite completes (via afterAll)

afterAll(async () => {
  // Delete database instance after all tests in suite complete
  // This ensures clean state for next test suite and handles test failures
  // Even if tests fail, the instance is cleaned up here
  await closeTestDatabase()
  resetDbInstance()
})
