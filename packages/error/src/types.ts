/**
 * Catalog error structure - safe error returned to users
 */
export interface CatalogError {
  code: string
  message: string
}

/**
 * Error with message property (Kent C. Dodds pattern)
 * Used for type-safe error message extraction
 */
export interface ErrorWithMessage {
  message: string
}

/**
 * Options for capturing an error
 */
export interface CaptureErrorOptions {
  /** Error code (must be registered in catalog) */
  code: string
  /** Real error object (sent to Sentry with full stack trace) */
  error: unknown
  /** Component/feature label for Sentry */
  label: string
  /** Additional context (sent to Sentry only, not exposed to users) */
  data?: Record<string, unknown>
  /** Tags for filtering in Sentry */
  tags?: {
    /** Application name: 'api' | 'web' | 'mobile' | 'docs' (required) */
    app: string
    /** Package name: '@repo/auth' | '@repo/db' (optional) */
    package?: string
    /** Module name: 'user-service' | 'payment-handler' (optional) */
    module?: string
    /** Additional custom tags */
    [key: string]: string | undefined
  }
  /** Error level for Sentry */
  level?: 'error' | 'warning' | 'info'
}
