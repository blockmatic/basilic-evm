/**
 * Vitest Test Setup
 *
 * Runs before each test file.
 * The database is already created in vitest.global-setup.ts and shared across all test files.
 *
 * ## Test Database Lifecycle
 *
 * A single PGLite in-memory database is shared across all test files:
 *
 * 1. **globalSetup**: Creates a single database instance and runs migrations (once for all tests)
 * 2. **Tests run**: All test files share the same database instance
 *    - Tests can share state/data across files if needed
 *    - Example: Create an account in one test file, then test login in another
 * 3. **globalTeardown**: Deletes the database instance after all tests complete
 *
 * ## Important Notes
 *
 * - Database instance is created once before all test files
 * - Database instance is deleted once after all test files complete (handles test failures too)
 * - No `afterEach` hook - data persists across tests to allow test dependencies
 * - Tests should clean up their own data if needed, or rely on the global teardown
 */
