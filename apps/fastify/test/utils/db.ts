/**
 * Test Database Utilities
 *
 * Manages PGLite in-memory database instances for testing.
 *
 * ## Lifecycle
 *
 * - **getTestDatabase()**: Gets or creates a singleton PGLite instance
 * - **resetTestDatabase()**: Closes existing instance and creates a fresh one
 * - **closeTestDatabase()**: Closes and deletes the instance
 *
 * ## Usage
 *
 * Used by `vitest.setup.ts` to manage database lifecycle:
 * - `beforeAll`: Calls `resetTestDatabase()` to ensure fresh instance per suite
 * - `afterAll`: Calls `closeTestDatabase()` to clean up
 *
 * @module test/utils/db
 */

import { PGlite } from '@electric-sql/pglite'

// Singleton pattern for test database - reset per test suite
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
 * Called in `afterAll` hook to clean up after test suite completes.
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
 * This ensures each test suite starts with a completely clean database.
 * Called in `beforeAll` hook to set up fresh database per suite.
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
