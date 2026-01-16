import { initSentry, registerErrors } from '@repo/error'
import { env } from './lib/env'
import { webErrors } from './lib/error-catalog'

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // 1. Register app errors FIRST
    registerErrors(webErrors)

    // 2. Initialize Sentry
    const dsn = env.NEXT_PUBLIC_SENTRY_DSN
    const environment = env.NEXT_PUBLIC_SENTRY_ENVIRONMENT

    if (dsn) {
      initSentry({ dsn, environment })
    }
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    // Edge runtime initialization if needed
  }
}
