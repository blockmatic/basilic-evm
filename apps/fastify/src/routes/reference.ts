import type { FastifyPluginAsync } from 'fastify'
import { env } from '../lib/env.js'
import { getReferenceHtml } from './reference/template.js'

const referenceRoutes: FastifyPluginAsync = async fastify => {
  // Serve OpenAPI JSON
  fastify.get(
    '/openapi.json',
    {
      schema: {
        hide: true,
        tags: ['public'],
        security: [],
      },
    },
    async (_request, reply) => {
      const openApiDoc = fastify.swagger()
      return reply.send(openApiDoc)
    },
  )

  // Serve custom HTML page with Scalar UI and login button
  fastify.get(
    '/',
    {
      schema: {
        hide: true,
        tags: ['public'],
        security: [],
      },
    },
    async (request, reply) => {
      const apiUrl = `${request.protocol}://${request.hostname}${request.url.includes(':') ? `:${env.PORT}` : ''}`
      const openApiUrl = `${apiUrl}/reference/openapi.json`
      const callbackUrl = `${apiUrl}/reference/callback`

      const html = getReferenceHtml(apiUrl, openApiUrl, callbackUrl)
      return reply.type('text/html').send(html)
    },
  )
}

export default referenceRoutes
export const prefixOverride = '/reference'
