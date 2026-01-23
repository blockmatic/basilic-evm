import type { FastifyPluginAsync } from 'fastify'

import { env } from '../lib/env.js'

type FakeEmailProvider = {
  extractToken: () => string | null
}

// Shared fake email provider instance for E2E tests
// This will be set when server starts in development/test mode
let sharedFakeEmail: FakeEmailProvider | null = null

/**
 * Set the shared fake email provider instance.
 * Called from server.ts when starting in development/test mode.
 */
export function setSharedFakeEmail(provider: FakeEmailProvider | null) {
  sharedFakeEmail = provider
}

const test: FastifyPluginAsync = async (fastify): Promise<void> => {
  // Only register test routes in test/development environments (for E2E tests)
  const allowedEnvs = ['test', 'development']
  if (!env.NODE_ENV || !allowedEnvs.includes(env.NODE_ENV)) {
    return
  }

  fastify.get('/api/test/last-magic-link', async (_request, reply) => {
    // Try to access fake email provider from fastify instance (for unit tests)
    const testApp = fastify as typeof fastify & { fakeEmail?: FakeEmailProvider }
    const fakeEmail = testApp.fakeEmail ?? sharedFakeEmail

    if (!fakeEmail) {
      return reply.code(500).send({ error: 'Fake email provider not available' })
    }

    const token = fakeEmail.extractToken()
    if (!token) {
      return reply.code(404).send({ error: 'No magic link token found' })
    }

    return { token }
  })
}

export default test
