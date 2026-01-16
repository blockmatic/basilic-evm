/**
 * Maps HTTP status codes to error catalog codes
 * Bridges standard HTTP errors (thrown in routes) and catalog error codes (used for reporting)
 *
 * @param statusCode - HTTP status code (optional)
 * @returns Error catalog code string
 */
export function mapHttpStatusToErrorCode(statusCode?: number): string {
  if (!statusCode) {
    return 'SERVER_ERROR'
  }

  // 4xx Client Errors
  // Fallback strategy: Unmapped 4xx codes default to BAD_REQUEST since they indicate
  // client-side issues. For specialized codes (418, 426, 451, etc.), apps can register
  // custom error codes and handle them in route-specific error handlers.
  if (statusCode >= 400 && statusCode < 500) {
    const clientErrors: Record<number, string> = {
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      409: 'CONFLICT',
      422: 'INVALID_INPUT',
      429: 'RATE_LIMIT_EXCEEDED',
      // Note: Uncommon codes (418, 426, 451, etc.) fall back to BAD_REQUEST
      // Add them here if your app uses them specifically
    }
    return clientErrors[statusCode] ?? 'BAD_REQUEST'
  }

  // 5xx Server Errors
  // Fallback strategy: Unmapped 5xx codes default to SERVER_ERROR since they indicate
  // server-side issues. Add specific codes if your app needs to distinguish them.
  if (statusCode >= 500) {
    const serverErrors: Record<number, string> = {
      500: 'SERVER_ERROR',
      502: 'BAD_GATEWAY',
      503: 'SERVICE_UNAVAILABLE',
      504: 'GATEWAY_TIMEOUT',
      // Add other 5xx codes here if needed (507, 508, 509, 510, 511)
    }
    return serverErrors[statusCode] ?? 'SERVER_ERROR'
  }

  // 2xx, 3xx, or invalid status codes
  // This should rarely happen since these aren't errors, but we handle it gracefully
  return 'UNEXPECTED_ERROR'
}
