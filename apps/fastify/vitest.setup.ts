// Set DATABASE_URL before env validation
// This must happen before any imports that use env.ts
process.env.DATABASE_URL = 'postgresql://localhost/test'
process.env.NODE_ENV = 'test'

import { afterAll, beforeAll } from 'vitest'
import { closeTestDatabase, getTestDatabase } from './test/utils/db.js'

beforeAll(async () => {
  await getTestDatabase()
})

afterAll(async () => {
  await closeTestDatabase()
})
