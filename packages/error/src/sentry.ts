import { logger } from '@repo/utils/logger'
import type * as SentryTypes from '@sentry/node'

/**
 * Options for initializing Sentry
 */
export interface InitSentryOptions {
  /** Sentry DSN (optional - if not provided, Sentry is disabled) */
  dsn?: string
  /** Environment name (e.g., 'production', 'staging', 'development') */
  environment?: string
  /** Release version */
  release?: string
  /** Optional custom beforeSend hook for domain-specific scrubbing */
  beforeSend?: (
    event: SentryTypes.ErrorEvent,
    hint: SentryTypes.EventHint,
  ) => SentryTypes.ErrorEvent | null
}

/**
 * Initializes Sentry for error tracking
 * Supports both @sentry/node (for Fastify/Node.js) and @sentry/nextjs (for Next.js)
 * Uses Sentry's built-in PII scrubbing by default
 *
 * @param options - Sentry initialization options
 */
export function initSentry(options: InitSentryOptions): void {
  if (!options.dsn) {
    logger.warn('Sentry DSN not configured - error reporting disabled')
    return
  }

  // Try to import @sentry/nextjs first (for Next.js apps)
  // If that fails, fall back to @sentry/node (for Fastify/Node.js apps)
  let Sentry: typeof SentryTypes
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    Sentry = require('@sentry/nextjs')
  } catch {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      Sentry = require('@sentry/node')
    } catch {
      logger.warn(
        'Sentry packages not found - error reporting disabled. Install @sentry/node or @sentry/nextjs',
      )
      return
    }
  }

  Sentry.init({
    dsn: options.dsn,
    environment: options.environment ?? 'development',
    release: options.release,
    tracesSampleRate: options.environment === 'production' ? 0.1 : 1.0,
    // Optional: custom beforeSend for domain-specific scrubbing
    // Sentry's built-in scrubbing handles most cases automatically
    beforeSend: options.beforeSend,
    ignoreErrors: [
      'ResizeObserver loop',
      'Non-Error promise rejection',
      'NetworkError',
      'Failed to fetch',
    ],
  })
}
