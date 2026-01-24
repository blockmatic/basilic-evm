import type { ErrorWithMessage } from '@repo/utils/error'
import type { Logger } from '@repo/utils/logger'
import type { clientErrors } from './catalogs/client.js'
import type { commonErrors } from './catalogs/common.js'
import type { serverErrors } from './catalogs/server.js'

/**
 * Options for capturing an error to Sentry
 */
export interface CaptureErrorOptions {
  /** Real error object (sent to Sentry with full stack trace) */
  error: unknown
  /** Component/feature label for Sentry */
  label: string
  /** Optional error code (used as tag only, not validated) */
  code?: string
  /** Tags for filtering in Sentry */
  tags?: Record<string, string>
  /** Additional context (sent to Sentry only, not exposed to users) */
  data?: Record<string, unknown>
  /** Error level for Sentry */
  level?: 'error' | 'warning' | 'info'
  /** Whether to report to Sentry (default: true) */
  report?: boolean
  /** Optional logger instance (for non-Fastify contexts only, Fastify handles logging) */
  logger?: Logger
}

/**
 * Catalog error structure returned by captureError
 */
export interface CatalogError {
  code: string
  message: string
}

/**
 * Core error codes from server, client, and common catalogs
 * This is a union type of all core error code strings
 */
export type CoreErrorCode =
  | keyof typeof serverErrors
  | keyof typeof clientErrors
  | keyof typeof commonErrors

// Re-export ErrorWithMessage for convenience
export type { ErrorWithMessage }
