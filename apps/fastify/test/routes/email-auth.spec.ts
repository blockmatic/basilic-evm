import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import type { TestApp } from '../utils/fastify.js'
import { buildTestApp } from '../utils/fastify.js'

describe('Magic Link Authentication', () => {
  let fastify: TestApp

  beforeAll(async () => {
    fastify = await buildTestApp()
  })

  afterAll(async () => {
    await fastify.close()
  })

  beforeEach(() => {
    // Clear email outbox before each test
    fastify.fakeEmail.clear()
  })

  describe('Email Validation', () => {
    it('should return 400 for invalid email format', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/api/auth/sign-in/magic-link',
        payload: {
          email: 'invalid-email',
        },
      })

      expect(response.statusCode).toBe(400)
      const body = JSON.parse(response.body)
      expect(body).toMatchObject({
        code: expect.stringMatching(/VALIDATION_ERROR|FST_ERR_VALIDATION|INVALID_INPUT/),
        message: expect.any(String),
      })
    })

    it('should return 400 for missing email', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/api/auth/sign-in/magic-link',
        payload: {},
      })

      expect(response.statusCode).toBe(400)
    })
  })

  describe('Send Magic Link', () => {
    it('should send magic link email and capture it in fake outbox', async () => {
      const email = 'test@example.com'

      const response = await fastify.inject({
        method: 'POST',
        url: '/api/auth/sign-in/magic-link',
        payload: {
          email,
        },
      })

      expect(response.statusCode).toBe(200)

      // Verify email was sent
      const sentEmail = fastify.fakeEmail.last()
      expect(sentEmail).toBeDefined()
      expect(sentEmail?.to).toBe(email)
      expect(sentEmail?.subject).toBe('Sign in to your account')
      expect(sentEmail?.html).toContain('magic-link')
    })

    it('should extract magic link URL from email', async () => {
      const email = 'test@example.com'

      await fastify.inject({
        method: 'POST',
        url: '/api/auth/sign-in/magic-link',
        payload: {
          email,
        },
      })

      const sentEmail = fastify.fakeEmail.last()
      expect(sentEmail).toBeDefined()

      const magicLink = fastify.fakeEmail.extractMagicLink(sentEmail)
      expect(magicLink).toBeTruthy()
      expect(magicLink).toContain('magic-link/verify')
      expect(magicLink).toContain('token=')
    })

    it('should extract token from magic link URL', async () => {
      const email = 'test@example.com'

      await fastify.inject({
        method: 'POST',
        url: '/api/auth/sign-in/magic-link',
        payload: {
          email,
        },
      })

      const token = fastify.fakeEmail.extractToken()
      expect(token).toBeTruthy()
      expect(typeof token).toBe('string')
      expect(token?.length).toBeGreaterThan(0)
    })
  })

  describe('Verify Magic Link Token', () => {
    it('should verify valid magic link token and set session cookie', async () => {
      const email = 'test@example.com'

      // Send magic link
      await fastify.inject({
        method: 'POST',
        url: '/api/auth/sign-in/magic-link',
        payload: {
          email,
        },
      })

      // Extract token from email
      const token = fastify.fakeEmail.extractToken()
      expect(token).toBeTruthy()

      // Verify token
      const verifyResponse = await fastify.inject({
        method: 'GET',
        url: `/api/auth/magic-link/verify?token=${token}`,
      })

      // Should redirect or return success
      expect([200, 302]).toContain(verifyResponse.statusCode)

      // Check for Set-Cookie header
      const setCookieHeader = verifyResponse.headers['set-cookie']
      expect(setCookieHeader).toBeDefined()

      // Verify cookie contains session token
      const cookies = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader]
      const sessionCookie = cookies.find(cookie => cookie.includes('better-auth.session_token'))
      expect(sessionCookie).toBeDefined()
      expect(sessionCookie).toContain('better-auth.session_token=')
    })

    it('should return error for invalid token', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/auth/magic-link/verify?token=invalid-token-12345',
      })

      // Should return error status (Better Auth returns 302 redirect for invalid tokens)
      expect([302, 400, 401, 404]).toContain(response.statusCode)

      // Should not set cookie
      const setCookieHeader = response.headers['set-cookie']
      if (setCookieHeader) {
        const cookies = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader]
        const sessionCookie = cookies.find(cookie => cookie.includes('better-auth.session_token'))
        expect(sessionCookie).toBeUndefined()
      }
    })

    it('should return error for missing token', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/auth/magic-link/verify',
      })

      expect([400, 401, 404]).toContain(response.statusCode)
    })
  })

  describe('Protected Route Access', () => {
    it('should access protected route after magic link authentication', async () => {
      const email = 'test@example.com'

      // Send magic link
      await fastify.inject({
        method: 'POST',
        url: '/api/auth/sign-in/magic-link',
        payload: {
          email,
        },
      })

      // Extract token and verify
      const token = fastify.fakeEmail.extractToken()
      expect(token).toBeTruthy()

      const verifyResponse = await fastify.inject({
        method: 'GET',
        url: `/api/auth/magic-link/verify?token=${token}`,
      })

      expect([200, 302]).toContain(verifyResponse.statusCode)

      // Extract session cookie
      const setCookieHeader = verifyResponse.headers['set-cookie']
      expect(setCookieHeader).toBeDefined()

      const cookies = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader]
      const sessionCookie = cookies.find(cookie => cookie.includes('better-auth.session_token'))
      expect(sessionCookie).toBeDefined()

      // Extract cookie value
      const cookieMatch = sessionCookie?.match(/better-auth\.session_token=([^;]+)/)
      expect(cookieMatch).toBeDefined()
      const cookieValue = cookieMatch?.[1]

      // Access protected route with session cookie
      const walletsResponse = await fastify.inject({
        method: 'GET',
        url: '/wallets',
        headers: {
          Cookie: `better-auth.session_token=${cookieValue}`,
        },
      })

      // Should succeed (200 with empty wallets array for new user)
      expect(walletsResponse.statusCode).toBe(200)
      const walletsBody = JSON.parse(walletsResponse.body)
      expect(walletsBody).toHaveProperty('wallets')
      expect(Array.isArray(walletsBody.wallets)).toBe(true)
    })

    it('should reject protected route access without session cookie', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/wallets',
      })

      expect(response.statusCode).toBe(401)
    })
  })

  describe('Full Magic Link Flow', () => {
    it('should complete full authentication flow: send -> verify -> access protected route', async () => {
      const email = 'fullflow@example.com'

      // Step 1: Send magic link
      const sendResponse = await fastify.inject({
        method: 'POST',
        url: '/api/auth/sign-in/magic-link',
        payload: {
          email,
        },
      })
      expect(sendResponse.statusCode).toBe(200)

      // Step 2: Verify email was sent and extract token
      const sentEmail = fastify.fakeEmail.last()
      expect(sentEmail).toBeDefined()
      expect(sentEmail?.to).toBe(email)

      const magicLink = fastify.fakeEmail.extractMagicLink()
      expect(magicLink).toBeTruthy()

      const token = fastify.fakeEmail.extractToken()
      expect(token).toBeTruthy()

      // Step 3: Verify token
      const verifyResponse = await fastify.inject({
        method: 'GET',
        url: `/api/auth/magic-link/verify?token=${token}`,
      })
      expect([200, 302]).toContain(verifyResponse.statusCode)

      // Step 4: Extract session cookie
      const setCookieHeader = verifyResponse.headers['set-cookie']
      expect(setCookieHeader).toBeDefined()

      const cookies = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader]
      const sessionCookie = cookies.find(cookie => cookie.includes('better-auth.session_token'))
      expect(sessionCookie).toBeDefined()

      const cookieMatch = sessionCookie?.match(/better-auth\.session_token=([^;]+)/)
      const cookieValue = cookieMatch?.[1]

      // Step 5: Access protected route
      const walletsResponse = await fastify.inject({
        method: 'GET',
        url: '/wallets',
        headers: {
          Cookie: `better-auth.session_token=${cookieValue}`,
        },
      })
      expect(walletsResponse.statusCode).toBe(200)

      // Step 6: Verify session is valid by checking session endpoint
      const sessionResponse = await fastify.inject({
        method: 'GET',
        url: '/api/auth/get-session',
        headers: {
          Cookie: `better-auth.session_token=${cookieValue}`,
        },
      })
      expect(sessionResponse.statusCode).toBe(200)

      const sessionBody = JSON.parse(sessionResponse.body)
      expect(sessionBody).toHaveProperty('user')
      expect(sessionBody.user).not.toBeNull()
      expect(sessionBody.user.email).toBe(email)
      expect(sessionBody).toHaveProperty('session')
      expect(sessionBody.session).not.toBeNull()
    })
  })

  describe('Magic Link JWT Flow', () => {
    it('should return JWT token when format=jwt', async () => {
      const email = 'jwt@example.com'

      // Send magic link
      await fastify.inject({
        method: 'POST',
        url: '/api/auth/sign-in/magic-link',
        payload: {
          email,
        },
      })

      // Extract token from email
      const token = fastify.fakeEmail.extractToken()
      expect(token).toBeTruthy()

      // Verify token with format=jwt parameter
      const verifyResponse = await fastify.inject({
        method: 'GET',
        url: `/api/auth/magic-link/verify?token=${token}&format=jwt`,
      })

      // Should return 200 with JWT token in response body
      expect(verifyResponse.statusCode).toBe(200)

      const body = JSON.parse(verifyResponse.body)
      expect(body).toHaveProperty('token')
      expect(typeof body.token).toBe('string')
      expect(body.token.length).toBeGreaterThan(0)

      // Should NOT set session cookie when format=jwt
      const setCookieHeader = verifyResponse.headers['set-cookie']
      if (setCookieHeader) {
        const cookies = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader]
        const sessionCookie = cookies.find(cookie => cookie.includes('better-auth.session_token'))
        expect(sessionCookie).toBeUndefined()
      }
    })

    it('should authenticate with JWT token in Authorization header', async () => {
      const email = 'jwtauth@example.com'

      // Send magic link
      await fastify.inject({
        method: 'POST',
        url: '/api/auth/sign-in/magic-link',
        payload: {
          email,
        },
      })

      // Extract token and verify with format=jwt
      const magicLinkToken = fastify.fakeEmail.extractToken()
      expect(magicLinkToken).toBeTruthy()

      const verifyResponse = await fastify.inject({
        method: 'GET',
        url: `/api/auth/magic-link/verify?token=${magicLinkToken}&format=jwt`,
      })

      expect(verifyResponse.statusCode).toBe(200)
      const { token: jwtToken } = JSON.parse(verifyResponse.body)
      expect(jwtToken).toBeTruthy()

      // Access protected route with JWT token
      const walletsResponse = await fastify.inject({
        method: 'GET',
        url: '/wallets',
        headers: {
          Authorization: `Bearer ${jwtToken}`,
        },
      })

      // Should succeed (200 with empty wallets array for new user)
      expect(walletsResponse.statusCode).toBe(200)
      const walletsBody = JSON.parse(walletsResponse.body)
      expect(walletsBody).toHaveProperty('wallets')
      expect(Array.isArray(walletsBody.wallets)).toBe(true)
    })

    it('should work alongside session cookies', async () => {
      const emailCookie = 'cookie@example.com'
      const emailJwt = 'jwt@example.com'

      // Test session cookie flow
      await fastify.inject({
        method: 'POST',
        url: '/api/auth/sign-in/magic-link',
        payload: {
          email: emailCookie,
        },
      })

      const cookieToken = fastify.fakeEmail.extractToken()
      const cookieVerifyResponse = await fastify.inject({
        method: 'GET',
        url: `/api/auth/magic-link/verify?token=${cookieToken}`,
      })

      expect([200, 302]).toContain(cookieVerifyResponse.statusCode)
      const cookieHeader = cookieVerifyResponse.headers['set-cookie']
      expect(cookieHeader).toBeDefined()

      // Test JWT flow
      await fastify.inject({
        method: 'POST',
        url: '/api/auth/sign-in/magic-link',
        payload: {
          email: emailJwt,
        },
      })

      const jwtToken = fastify.fakeEmail.extractToken()
      const jwtVerifyResponse = await fastify.inject({
        method: 'GET',
        url: `/api/auth/magic-link/verify?token=${jwtToken}&format=jwt`,
      })

      expect(jwtVerifyResponse.statusCode).toBe(200)
      const { token: jwtAuthToken } = JSON.parse(jwtVerifyResponse.body)
      expect(jwtAuthToken).toBeTruthy()

      // Both methods should work independently
      // Session cookie flow
      const cookies = Array.isArray(cookieHeader) ? cookieHeader : [cookieHeader]
      const sessionCookie = cookies.find(cookie => cookie.includes('better-auth.session_token'))
      const cookieMatch = sessionCookie?.match(/better-auth\.session_token=([^;]+)/)
      const cookieValue = cookieMatch?.[1]

      const walletsCookieResponse = await fastify.inject({
        method: 'GET',
        url: '/wallets',
        headers: {
          Cookie: `better-auth.session_token=${cookieValue}`,
        },
      })
      expect(walletsCookieResponse.statusCode).toBe(200)

      // JWT flow
      const walletsJwtResponse = await fastify.inject({
        method: 'GET',
        url: '/wallets',
        headers: {
          Authorization: `Bearer ${jwtAuthToken}`,
        },
      })
      expect(walletsJwtResponse.statusCode).toBe(200)
    })

    it('should return error for invalid token with format=jwt', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/auth/magic-link/verify?token=invalid-token-12345&format=jwt',
      })

      // Should return error status
      expect([400, 401, 404]).toContain(response.statusCode)

      // Should not return token
      if (response.statusCode === 200) {
        const body = JSON.parse(response.body)
        expect(body).not.toHaveProperty('token')
      }
    })
  })
})
