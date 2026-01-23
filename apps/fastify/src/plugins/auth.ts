import { captureError } from '@repo/error/node'
import type { FastifyPluginAsync } from 'fastify'
import fp from 'fastify-plugin'
import { getDb } from '../db/index.js'
import { type Auth, getAuth } from '../lib/auth.js'
import { env } from '../lib/env.js'

declare module 'fastify' {
  interface FastifyRequest {
    session?: {
      user: {
        id: string
        email?: string | null
      }
      session: {
        id: string
        userId: string
        expiresAt: Date
      }
    } | null
  }

  interface FastifyInstance {
    auth: Auth
  }
}

const authPlugin: FastifyPluginAsync = async fastify => {
  // Ensure db is initialized before creating auth
  await getDb()
  const auth = await getAuth()

  // Add auth instance to fastify
  fastify.decorate('auth', auth)

  // Session validation hook - checks both session cookies and JWT tokens
  fastify.addHook('onRequest', async request => {
    try {
      // Check for JWT token in Authorization header
      const authHeader = request.headers.authorization
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.substring(7)
        try {
          // Verify JWT token and get session
          // Better Auth's getSession should handle JWT tokens when passed in Authorization header
          const session = await auth.api.getSession({
            headers: {
              ...request.headers,
              authorization: `Bearer ${token}`,
            },
          })
          request.session = session
          return
        } catch {
          // If JWT validation fails, fall through to cookie-based session check
          // This allows both methods to work independently
        }
      }

      // Fallback to cookie-based session (default behavior)
      const session = await auth.api.getSession({
        headers: request.headers,
      })
      request.session = session
    } catch (error) {
      captureError({
        code: 'INTERNAL_ERROR',
        error: error instanceof Error ? error : new Error(String(error)),
        logger: request.log,
        label: 'auth.api.getSession failed',
        data: {
          method: request.method,
          url: request.url,
        },
        tags: {
          app: 'api',
          module: 'auth-service',
          route: request.url,
        },
      })
      request.session = null
    }
  })

  // Mount Better Auth routes at /api/auth/*
  fastify.all('/api/auth/*', async (request, reply) => {
    // Handle JWT format for magic link verification
    const urlObj = new URL(request.url, env.BETTER_AUTH_URL)
    const isMagicLinkVerify = urlObj.pathname === '/api/auth/magic-link/verify'
    const formatJwt = urlObj.searchParams.get('format') === 'jwt'

    if (isMagicLinkVerify && formatJwt && request.method === 'GET') {
      // Handle JWT format: verify magic link and return JWT token
      try {
        // Call Better Auth's magic link verification internally
        const verifyUrl = new URL(request.url, env.BETTER_AUTH_URL)
        verifyUrl.searchParams.delete('format') // Remove format param for Better Auth

        const verifyHeaders = new Headers()
        for (const [key, val] of Object.entries(request.headers)) {
          if (val != null) {
            if (Array.isArray(val)) {
              for (const v of val) {
                verifyHeaders.append(key, String(v))
              }
            } else {
              verifyHeaders.append(key, String(val))
            }
          }
        }

        const verifyReq = new Request(verifyUrl.toString(), {
          method: 'GET',
          headers: verifyHeaders,
        })

        const verifyResponse = await auth.handler(verifyReq)

        // If verification failed, return the error response
        if (verifyResponse.status !== 200 && verifyResponse.status !== 302) {
          reply.status(verifyResponse.status)
          verifyResponse.headers.forEach((value: string, key: string) => {
            if (key.toLowerCase() !== 'set-cookie') {
              reply.header(key, value)
            }
          })
          const text = verifyResponse.body ? await verifyResponse.text() : null
          return text
        }

        // Extract session cookie from verification response
        const setCookieHeaders = verifyResponse.headers.getSetCookie()
        const sessionCookie = setCookieHeaders.find(cookie =>
          cookie.includes('better-auth.session_token'),
        )

        if (!sessionCookie) {
          reply.status(401).send({ error: 'Failed to create session' })
          return null
        }

        // Extract cookie value
        const cookieMatch = sessionCookie.match(/better-auth\.session_token=([^;]+)/)
        if (!cookieMatch) {
          reply.status(401).send({ error: 'Failed to extract session token' })
          return null
        }

        // Get JWT token using Better Auth's token endpoint
        const tokenHeaders = new Headers()
        tokenHeaders.append('Cookie', `better-auth.session_token=${cookieMatch[1]}`)

        const tokenReq = new Request(new URL('/api/auth/token', env.BETTER_AUTH_URL).toString(), {
          method: 'GET',
          headers: tokenHeaders,
        })

        const tokenResponse = await auth.handler(tokenReq)

        if (tokenResponse.status !== 200) {
          reply.status(tokenResponse.status)
          const text = tokenResponse.body ? await tokenResponse.text() : null
          return text
        }

        const tokenData = await tokenResponse.json()

        // Return JWT token in response body
        reply.status(200).header('Content-Type', 'application/json').send({
          token: tokenData.token,
        })
        return null
      } catch (error) {
        const catalogError = captureError({
          code: 'INTERNAL_ERROR',
          error: error instanceof Error ? error : new Error(String(error)),
          logger: request.log,
          label: 'magic link JWT verification failed',
          data: {
            method: request.method,
            url: request.url,
          },
          tags: {
            app: 'api',
            module: 'auth-service',
            route: request.url,
          },
        })

        reply.status(500).send({
          code: catalogError.code,
          message: catalogError.message,
        })
        return null
      }
    }

    // Build full URL using trusted env.BETTER_AUTH_URL as base
    const url = new URL(request.url, env.BETTER_AUTH_URL)

    // Build Headers object
    const headers = new Headers()
    for (const [key, val] of Object.entries(request.headers)) {
      if (val != null) {
        if (Array.isArray(val)) {
          for (const v of val) {
            headers.append(key, String(v))
          }
        } else {
          headers.append(key, String(val))
        }
      }
    }

    // Build body - only for methods that support bodies (not GET/HEAD)
    const method = request.method.toUpperCase()
    const contentType = request.headers['content-type']?.toLowerCase() ?? ''
    let body: string | Buffer | Uint8Array | ArrayBuffer | undefined
    let shouldRemoveContentLength = false

    if (request.body && method !== 'GET' && method !== 'HEAD') {
      const rawBody = request.body

      // Pass through binary/string types unchanged
      if (
        rawBody instanceof Buffer ||
        rawBody instanceof Uint8Array ||
        rawBody instanceof ArrayBuffer ||
        typeof rawBody === 'string'
      ) {
        body = rawBody
      }
      // Handle form-urlencoded
      else if (
        contentType.includes('application/x-www-form-urlencoded') ||
        (typeof rawBody === 'object' &&
          rawBody !== null &&
          !Array.isArray(rawBody) &&
          contentType.includes('form'))
      ) {
        // Convert plain object to URLSearchParams
        const params = new URLSearchParams()
        for (const [key, value] of Object.entries(rawBody)) {
          if (value != null) {
            params.append(key, String(value))
          }
        }
        body = params.toString()
        shouldRemoveContentLength = true
      }
      // Handle JSON (default for plain objects or explicit JSON content-type)
      else if (
        contentType.includes('application/json') ||
        (typeof rawBody === 'object' && rawBody !== null)
      ) {
        body = JSON.stringify(rawBody)
        shouldRemoveContentLength = true
      }
      // Fallback: stringify if we can't determine type
      else {
        body = String(rawBody)
        shouldRemoveContentLength = true
      }
    }

    // Remove content-length if we re-encoded the body
    if (shouldRemoveContentLength) {
      headers.delete('content-length')
    }

    // Construct Fetch API Request
    const req = new Request(url.toString(), {
      method: request.method,
      headers,
      ...(body ? { body } : {}),
    })

    // Delegate to Better Auth
    try {
      // Better Auth handler returns a standard Fetch API Response
      const authResponse = await auth.handler(req)

      // Forward response
      reply.status(authResponse.status)
      // Forward all headers except Set-Cookie (handled separately)
      authResponse.headers.forEach((value: string, key: string) => {
        if (key.toLowerCase() !== 'set-cookie') {
          reply.header(key, value)
        }
      })
      // Handle Set-Cookie headers separately to preserve multiple cookies
      const cookies = authResponse.headers.getSetCookie()
      for (const cookie of cookies) {
        reply.header('Set-Cookie', cookie)
      }

      if (authResponse.body) {
        const text = await authResponse.text()
        return text
      }
      return null
    } catch (error) {
      const catalogError = captureError({
        code: 'INTERNAL_ERROR',
        error: error instanceof Error ? error : new Error(String(error)),
        logger: request.log,
        label: 'auth.handler failed',
        data: {
          method: request.method,
          url: request.url,
        },
        tags: {
          app: 'api',
          module: 'auth-service',
          route: request.url,
        },
      })

      reply.status(500).send({
        code: catalogError.code,
        message: catalogError.message,
      })
      return null
    }
  })
}

export default fp(authPlugin, {
  name: 'auth',
  dependencies: [],
})
