import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { cleanupGroupDatabase, setupGroupDatabase } from '../../test/utils/db-setup.js'
import type { TestApp } from '../../test/utils/fastify.js'
import { buildTestApp } from '../../test/utils/fastify.js'

vi.setConfig({
  testTimeout: 30000,
  hookTimeout: 30000,
})

describe('GET /health', () => {
  let fastify: TestApp

  beforeAll(async () => {
    await setupGroupDatabase()
    fastify = await buildTestApp()
  })

  afterAll(async () => {
    await fastify.close()
    await cleanupGroupDatabase()
  })

  it('should return 200 status', async () => {
    const response = await fastify.inject({
      method: 'GET',
      url: '/health',
    })

    expect(response.statusCode).toBe(200)
  })

  it('should return response matching schema structure', async () => {
    const response = await fastify.inject({
      method: 'GET',
      url: '/health',
    })

    const data = JSON.parse(response.body)

    expect(data).toMatchObject({
      ok: true,
      now: expect.any(String),
    })
  })

  it('should return ok field as true', async () => {
    const response = await fastify.inject({
      method: 'GET',
      url: '/health',
    })

    const data = JSON.parse(response.body)

    expect(data.ok).toBe(true)
  })

  it('should return now field as valid ISO datetime string', async () => {
    const response = await fastify.inject({
      method: 'GET',
      url: '/health',
    })

    const data = JSON.parse(response.body)

    expect(data.now).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
    expect(() => new Date(data.now)).not.toThrow()
    expect(new Date(data.now).toISOString()).toBe(data.now)
  })

  it('should validate response against HealthResponseSchema', async () => {
    const response = await fastify.inject({
      method: 'GET',
      url: '/health',
    })

    const data = JSON.parse(response.body)

    expect(data.ok).toBe(true)
    expect(typeof data.now).toBe('string')
    expect(data.now).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
  })
})
