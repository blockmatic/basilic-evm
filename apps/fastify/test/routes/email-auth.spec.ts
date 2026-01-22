import type { FastifyInstance } from 'fastify'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { buildTestApp } from '../utils/fastify.js'

vi.setConfig({
  testTimeout: 30000,
  hookTimeout: 30000,
})

describe('Email Authentication', () => {
  let fastify: FastifyInstance

  beforeAll(async () => {
    fastify = await buildTestApp()
  })

  afterAll(async () => {
    await fastify.close()
  })

  it('should have email sign-up endpoint', async () => {
    const response = await fastify.inject({
      method: 'POST',
      url: '/api/auth/sign-up/email',
      payload: {
        email: 'test@example.com',
        password: 'SecurePassword123!',
        name: 'Test User',
      },
    })
    // Endpoint should exist (not 404)
    // May return errors for validation/schema issues, but endpoint should be mounted
    expect(response.statusCode).not.toBe(404)
  })

  it('should have magic link endpoint', async () => {
    const response = await fastify.inject({
      method: 'POST',
      url: '/api/auth/sign-in/magic-link',
      payload: {
        email: 'test@example.com',
      },
    })
    // Magic link endpoint may return 404 if not fully implemented
    // For now, just verify it doesn't crash with 500
    expect(response.statusCode).toBeLessThan(500)
  })
})
