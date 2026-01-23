import { captureError } from '@repo/error/node'
import type { FastifyPluginAsync } from 'fastify'
import fp from 'fastify-plugin'
import { getDb } from '../db/index.js'
import { type Auth, getAuth } from '../lib/auth.js'
import { proxyBetterAuthRequest } from '../lib/auth-proxy.js'
import { getSessionFromToken } from '../lib/auth-session.js'
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

  // Session validation hook - JWT-only Bearer token support
  fastify.addHook('onRequest', async request => {
    try {
      const authHeader = request.headers.authorization
      if (!authHeader?.startsWith('Bearer ')) {
        request.session = null
        return
      }

      const token = authHeader.substring(7).trim()
      const normalizedToken = token.startsWith('Bearer ') ? token.substring(7).trim() : token
      const { session } = await getSessionFromToken({ token: normalizedToken })
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
  fastify.all(
    '/api/auth/*',
    {
      schema: {
        tags: ['auth'],
        security: [],
      },
    },
    async (request, reply) =>
      proxyBetterAuthRequest({
        auth,
        baseUrl: env.BETTER_AUTH_URL,
        request,
        reply,
      }),
  )
}

export default fp(authPlugin, {
  name: 'auth',
  dependencies: [],
})
