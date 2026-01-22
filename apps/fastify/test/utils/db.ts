/**
 * Test Database Utilities
 *
 * Manages a single shared PGLite in-memory database instance for all tests.
 *
 * ## Lifecycle
 *
 * - **getTestDatabase()**: Gets or creates a singleton PGLite instance (used in global setup)
 * - **resetTestDatabase()**: Closes existing instance and creates a fresh one (NOT used in tests)
 * - **closeTestDatabase()**: Closes and deletes the instance (used in global teardown)
 *
 * ## Usage
 *
 * Used by `vitest.global-setup.ts` to manage database lifecycle:
 * - **globalSetup**: Calls `getTestDatabase()` to create single instance, then runs migrations
 * - **Tests run**: All test files share the same database instance via singleton pattern
 * - **globalTeardown**: Calls `closeTestDatabase()` to delete instance after all tests complete
 *
 * ## Important Notes
 *
 * - Single instance pattern: One database for ALL test files
 * - Instance created once before all test files execute
 * - Instance deleted once after all test files complete
 * - Tests can share state/data across files if needed
 * - No per-suite resets - use `resetTestDatabase()` only if you need a fresh instance (not recommended)
 *
 * @module test/utils/db
 */

import { PGlite } from '@electric-sql/pglite'

// Singleton pattern for test database - single shared instance for all tests
let pgLiteInstance: PGlite | null = null
let dbUrl: string | null = null

export const TEST_DATABASE_URL = 'postgresql://localhost/test'

/**
 * Get or create the test database instance.
 * Returns a singleton PGLite instance that persists until explicitly closed.
 *
 * @returns Database instance and connection URL
 */
export async function getTestDatabase() {
  if (!pgLiteInstance) {
    pgLiteInstance = new PGlite()
    await pgLiteInstance.waitReady
    // Generate connection string compatible with PostgreSQL clients
    dbUrl = TEST_DATABASE_URL
  }
  return { instance: pgLiteInstance, url: dbUrl ?? TEST_DATABASE_URL }
}

/**
 * Close and delete the test database instance.
 * This ensures clean state and frees memory.
 * Called in `vitest.global-setup.ts` teardown to clean up after all tests complete.
 */
export async function closeTestDatabase() {
  if (pgLiteInstance) {
    await pgLiteInstance.close()
    pgLiteInstance = null
    dbUrl = null
  }
}

/**
 * Reset the test database by closing existing instance and creating a fresh one.
 * This ensures a completely clean database.
 *
 * **Note**: This is NOT used in the standard test setup. The test suite uses a single
 * shared instance created in global setup. Only use this if you need to reset the
 * database mid-test (not recommended).
 *
 * @returns Fresh database instance and connection URL
 */
export async function resetTestDatabase() {
  // Always close and recreate for fresh database
  await closeTestDatabase()
  return await getTestDatabase()
}

/**
 * Setup helper - gets the test database instance.
 * Alias for getTestDatabase() for convenience.
 *
 * @returns Database instance
 */
export async function setupTestDatabase() {
  const { instance } = await getTestDatabase()
  return instance
}
