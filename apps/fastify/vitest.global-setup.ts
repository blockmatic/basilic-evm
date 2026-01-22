/**
 * Vitest Global Setup
 *
 * Runs once before ALL test files/suites.
 * Creates a single shared database instance for all tests.
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

import { readdir, readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { logger } from '@repo/utils/logger'
import type { GlobalSetupContext } from 'vitest/node'
import { resetDbInstance } from './src/db/index.js'
import { closeTestDatabase, getTestDatabase } from './test/utils/db.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export async function setup(_context: GlobalSetupContext) {
  // Reset database instance cache to ensure fresh connection
  resetDbInstance()

  // Create a single database instance for ALL test files
  // Use getTestDatabase() not resetTestDatabase() - we want one instance, not a reset
  const { instance } = await getTestDatabase()

  // Run migrations by executing SQL directly (migratePGLite silently fails)
  const migrationsDir = join(__dirname, 'src', 'db', 'migrations')

  try {
    const files = await readdir(migrationsDir)
    const migrationFiles = files.filter(f => f.endsWith('.sql')).sort()

    if (migrationFiles.length === 0) {
      logger.info({ migration: true }, 'No migrations found, skipping migration step')
      return
    }

    logger.info(
      { migration: true },
      `Found ${migrationFiles.length} migration file(s), running migrations...`,
    )

    // Execute each migration SQL file directly on the PGLite instance
    // Remove statement-breakpoint markers and execute as a single SQL script
    // PGLite's exec() can handle multiple statements separated by semicolons
    for (const file of migrationFiles) {
      let sql = await readFile(join(migrationsDir, file), 'utf-8')
      // Remove all statement-breakpoint markers (they're just Drizzle metadata)
      sql = sql.replace(/--> statement-breakpoint\s*/gi, '\n').trim()

      // Execute the entire SQL file - PGLite handles multiple statements
      try {
        await instance.exec(sql)
      } catch (err) {
        logger.error(
          { migration: true, error: err, file },
          `Failed to execute migration file ${file}`,
        )
        throw err
      }
    }

    // Verify tables were created - use a simple query to check if verification table exists
    try {
      await instance.exec('SELECT 1 FROM verification LIMIT 1')
      logger.info(
        { migration: true },
        'Migrations completed successfully - verification table exists',
      )
    } catch (err) {
      // If verification table doesn't exist, migrations didn't work
      logger.error(
        { migration: true, error: err },
        'Migrations completed but verification table does not exist',
      )
      throw new Error('Migrations completed but verification table was not created')
    }

    // Reset Drizzle instance cache so it will be recreated with the migrated schema
    // This ensures any code that calls getDb() after migrations will get a fresh Drizzle instance
    resetDbInstance()
  } catch (err) {
    logger.error({ migration: true, error: err }, 'Migration failed')
    throw err
  }
}

export async function teardown() {
  // Clean up database instance after all tests complete
  // This runs whether tests pass or fail
  await closeTestDatabase()
  resetDbInstance()
}
