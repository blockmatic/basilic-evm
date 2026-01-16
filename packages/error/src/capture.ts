import { logger } from '@repo/utils/logger'
import type * as SentryTypes from '@sentry/node'
import { getError } from './registry.js'
import type { CaptureErrorOptions, CatalogError } from './types.js'
import { toErrorWithMessage } from './utils.js'

let sentryWarningShown = false

/**
 * Gets Sentry client (supports both @sentry/node and @sentry/nextjs)
 */
function getSentryClient(): typeof SentryTypes | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('@sentry/nextjs')
  } catch {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      return require('@sentry/node')
    } catch {
      return null
    }
  }
}

/**
 * Captures an error to Sentry and returns a safe catalog error for API responses
 * Two-track error handling:
 * - Sentry gets REAL error (full stack trace, internal context)
 * - API returns SAFE catalog error (code + user-friendly message)
 *
 * @param options - Error capture options
 * @returns Safe catalog error for API response
 */
export function captureError(options: CaptureErrorOptions): CatalogError {
  const errorWithMessage = toErrorWithMessage(options.error)
  const catalogError = getError(options.code)

  // Validate error code exists (runtime check)
  if (!catalogError) {
    const fallback: CatalogError = {
      code: 'UNEXPECTED_ERROR',
      message: 'An unexpected error occurred',
    }
    const errorLogger = logger.child({ code: options.code, label: options.label })

    if (process.env.NODE_ENV === 'development') {
      errorLogger.error(
        `Unknown error code: "${options.code}". ` +
          `This usually means the error code was not registered during app startup. ` +
          `Ensure registerErrors() is called in your app entry point BEFORE any error handling code runs.`,
      )
    } else {
      errorLogger.warn(
        `Unknown error code: "${options.code}". Using fallback. ` +
          `The error code may not have been registered during app startup.`,
      )
    }
    return fallback
  }

  // Log with structured logging (Pino on server, console wrapper on client)
  const errorLogger = logger.child({
    errorCode: options.code,
    label: options.label,
    ...options.tags,
  })

  errorLogger.error(
    {
      error: options.error,
      ...options.data,
    },
    `[${options.label}] ${options.code}: ${errorWithMessage.message}`,
  )

  // Capture to Sentry asynchronously (non-blocking)
  // Use runtime-safe async execution (works in Node.js, Edge Runtime, and browsers)
  Promise.resolve().then(() => {
    const Sentry = getSentryClient()

    if (!Sentry) {
      if (!sentryWarningShown) {
        logger.warn('Sentry not initialized - error reporting disabled. Set SENTRY_DSN to enable.')
        sentryWarningShown = true
      }
      return
    }

    const sentryClient = Sentry.getClient()

    if (!sentryClient) {
      if (!sentryWarningShown) {
        logger.warn('Sentry not initialized - error reporting disabled. Set SENTRY_DSN to enable.')
        sentryWarningShown = true
      }
      return
    }

    // Capture REAL error in Sentry (async, non-blocking)
    // Sentry's built-in scrubbing handles PII automatically
    Sentry.captureException(
      options.error instanceof Error ? options.error : new Error(errorWithMessage.message),
      {
        tags: {
          errorCode: options.code,
          component: options.label,
          ...options.tags,
        },
        level: options.level ?? 'error',
        contexts: {
          error: {
            code: options.code,
            label: options.label,
            ...options.data,
          },
        },
      },
    )
  })

  // Return SAFE catalog error immediately (synchronous)
  return catalogError
}
