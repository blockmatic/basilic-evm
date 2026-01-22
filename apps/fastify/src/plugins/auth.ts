import { captureError } from '@repo/error/node'
import type { FastifyPluginAsync } from 'fastify'
import fp from 'fastify-plugin'
import type { Response } from 'undici-types'
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

  // Session validation hook
  fastify.addHook('onRequest', async request => {
    const session = await auth.api.getSession({
      headers: request.headers,
    })
    request.session = session
  })

  // Mount Better Auth routes at /api/auth/*
  fastify.all('/api/auth/*', async (request, reply) => {
    // Build full URL - Better Auth expects the full path including /api/auth
    const host = request.headers.host || `localhost:${env.PORT}`
    const protocol = request.headers['x-forwarded-proto'] || 'http'
    // Ensure the URL includes the full path
    const fullUrl = `${protocol}://${host}${request.url}`
    const url = new URL(fullUrl)

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
    const body =
      request.body && method !== 'GET' && method !== 'HEAD'
        ? JSON.stringify(request.body)
        : undefined

    // Construct Fetch API Request
    const req = new Request(url.toString(), {
      method: request.method,
      headers,
      ...(body ? { body } : {}),
    })

    // Delegate to Better Auth
    try {
      // Better Auth handler returns a standard Fetch API Response
      const authResponse: Response = await auth.handler(req)

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
