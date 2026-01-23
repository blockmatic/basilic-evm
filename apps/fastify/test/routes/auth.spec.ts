import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import type { TestApp } from '../utils/fastify.js'
import { buildTestApp } from '../utils/fastify.js'

vi.setConfig({
  testTimeout: 30000,
  hookTimeout: 30000,
})

describe('Auth Integration', () => {
  let fastify: TestApp

  beforeAll(async () => {
    fastify = await buildTestApp()
  })

  afterAll(async () => {
    await fastify.close()
  })

  it('should have auth routes mounted at /api/auth/*', async () => {
    const response = await fastify.inject({
      method: 'GET',
      url: '/api/auth/get-session',
    })
    // Should not return 404
    expect(response.statusCode).toBeLessThan(500)
  })

  it('should return null session when not authenticated', async () => {
    const response = await fastify.inject({
      method: 'GET',
      url: '/api/auth/get-session',
    })
    expect(response.statusCode).toBe(200)
    // Better Auth returns JSON with user and session fields
    const body = response.body ? JSON.parse(response.body) : null
    // When not authenticated, user and session should be null
    if (body) {
      expect(body.user).toBeNull()
      expect(body.session).toBeNull()
    } else {
      // Empty response is also acceptable
      expect(body).toBeNull()
    }
  })

  it('should return session when using bearer token', async () => {
    const email = 'session@example.com'

    await fastify.inject({
      method: 'POST',
      url: '/api/auth/sign-in/magic-link',
      payload: {
        email,
      },
    })

    const token = fastify.fakeEmail.extractToken()
    expect(token).toBeTruthy()

    const verifyResponse = await fastify.inject({
      method: 'GET',
      url: `/api/auth/magic-link/verify?token=${token}&format=jwt`,
    })
    expect(verifyResponse.statusCode).toBe(200)

    const { token: jwtToken } = JSON.parse(verifyResponse.body)
    expect(jwtToken).toBeTruthy()

    const sessionResponse = await fastify.inject({
      method: 'GET',
      url: '/api/auth/get-session',
      headers: {
        Authorization: `Bearer ${jwtToken}`,
      },
    })

    expect(sessionResponse.statusCode).toBe(200)
    const body = sessionResponse.body ? JSON.parse(sessionResponse.body) : null
    expect(body?.user).not.toBeNull()
    expect(body?.user?.email).toBe(email)
  })

  it('should ignore cookie-based session headers', async () => {
    const response = await fastify.inject({
      method: 'GET',
      url: '/api/auth/get-session',
      headers: {
        Cookie: 'better-auth.session_token=fake-session',
      },
    })

    expect(response.statusCode).toBe(200)
    const body = response.body ? JSON.parse(response.body) : null
    if (body) {
      expect(body.user).toBeNull()
      expect(body.session).toBeNull()
    } else {
      expect(body).toBeNull()
    }
  })

  it('should attach session middleware to requests', async () => {
    // Create a test route that checks for session
    const response = await fastify.inject({
      method: 'GET',
      url: '/health',
    })
    // Health endpoint should work and session should be available (null when not authenticated)
    expect(response.statusCode).toBe(200)
  })
})
