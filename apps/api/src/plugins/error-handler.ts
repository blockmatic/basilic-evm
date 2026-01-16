import { captureError, mapHttpStatusToErrorCode } from '@repo/error'
import type { FastifyError, FastifyInstance } from 'fastify'
import fp from 'fastify-plugin'

/**
 * Extracts module name from route path
 * Examples: /users/123 → 'user-service', /payments → 'payment-service'
 */
function extractModuleFromRoute(routePath: string): string | null {
  const match = routePath.match(/^\/([^/]+)/)
  if (!match) return null

  const resource = match[1]
  // Remove trailing 's' for plural resources (users → user)
  const singular = resource.replace(/s$/, '')
  return `${singular}-service`
}

/**
 * Fastify error handler plugin
 * Registers global error handler that captures errors to Sentry and returns safe catalog errors
 */
export default fp<Record<string, never>>(async (fastify: FastifyInstance) => {
  fastify.setErrorHandler((error: FastifyError, request, reply) => {
    const routePath = (request as { routerPath?: string }).routerPath ?? request.url.split('?')[0]
    const module = extractModuleFromRoute(routePath) ?? 'api-route'

    // captureError handles logging via @repo/utils/logger
    // Captures REAL error to Sentry with built-in PII scrubbing
    const catalogError = captureError({
      code: mapHttpStatusToErrorCode(error.statusCode),
      error, // ← Full stack trace → Sentry
      label: `${request.method} ${request.url}`,
      data: {
        requestId: request.id,
        method: request.method,
        url: request.url,
        headers: request.headers,
        body: request.body, // Sentry built-in scrubbing handles sensitive data
      },
      tags: {
        app: 'api',
        module,
        route: routePath,
        method: request.method,
      },
    })

    // Return SAFE catalog error
    reply.status(error.statusCode ?? 500).send({
      code: catalogError.code,
      message: catalogError.message,
    })
  })
})
