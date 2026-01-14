import * as Sentry from '@sentry/nextjs'
import { env as appEnv } from './lib/env'

/**
 * Initializes Sentry for client-side error tracking.
 * Follows RORO pattern (Receive an Object, Return an Object).
 */
export function initSentry({ dsn, environment }: { dsn?: string; environment?: string }) {
  if (!dsn) return { initialized: false }

  const env = environment ?? appEnv.NODE_ENV

  Sentry.init({
    dsn,
    environment: env,
    tracesSampleRate: env === 'production' ? 0.1 : 1.0,
    debug: env === 'development',
    replaysOnErrorSampleRate: 1.0,
    replaysSessionSampleRate: env === 'production' ? 0.1 : 1.0,
    integrations: [Sentry.replayIntegration({ maskAllText: false })],
  })

  return { initialized: true }
}
