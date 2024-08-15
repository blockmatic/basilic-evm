// Import necessary modules and configurations
import { appConfig } from '@/lib/config'
import { AppError } from '@/types/errors'
import * as Sentry from '@sentry/nextjs'

// Initialize Sentry with configuration
export function initializeSentry() {
  Sentry.init({
    dsn: appConfig.services.sentryDsn,
    tracesSampleRate: 1.0,
  })
}

// Capture and log exceptions with appropriate tags
export function captureException(error: AppError | Error) {
  if (error instanceof AppError) {
    // For AppError, use its code as a tag
    Sentry.captureException(error, { tags: { code: error.code } })
  } else {
    // For other errors, use a generic SYSTEM_ERROR tag
    Sentry.captureException(error, { tags: { code: 'SYSTEM_ERROR' } })
  }
}