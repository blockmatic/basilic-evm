import type { FastifyRequest } from 'fastify'

/**
 * Sanitize input string to prevent XSS attacks
 * Removes potentially dangerous characters and HTML tags
 */
export const sanitizeInput = (input: string): string => {
  return input
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim()
}

/**
 * Sanitize error message to prevent information leakage
 * Removes sensitive information like stack traces, paths, etc.
 */
export const sanitizeErrorMessage = (error: unknown, isProduction: boolean): string => {
  if (isProduction) {
    // In production, return generic error messages
    if (error instanceof Error) {
      // Only return error name and a generic message
      return `An error occurred: ${error.name}`
    }
    return 'An error occurred'
  }

  // In development, return full error message
  if (error instanceof Error) {
    return error.message
  }
  return String(error)
}

/**
 * Log security event
 */
export const logSecurityEvent = (
  request: FastifyRequest,
  event: string,
  details?: Record<string, unknown>,
): void => {
  const logData = {
    event,
    timestamp: new Date().toISOString(),
    ip: request.ip,
    method: request.method,
    url: request.url,
    userAgent: request.headers['user-agent'],
    ...details,
  }

  // In production, you might want to send this to a security monitoring service
  request.log.warn({ security: true, ...logData }, `Security event: ${event}`)
}

/**
 * Detect suspicious activity patterns
 */
export const detectSuspiciousActivity = (request: FastifyRequest): boolean => {
  const userAgent = request.headers['user-agent'] || ''
  const url = request.url

  // Check for common attack patterns
  const suspiciousPatterns = [
    /\.\./, // Path traversal
    /<script/i, // XSS attempts
    /union.*select/i, // SQL injection attempts
    /exec\(/i, // Code execution attempts
    /eval\(/i, // Code evaluation attempts
  ]

  // Check URL
  if (suspiciousPatterns.some(pattern => pattern.test(url))) {
    logSecurityEvent(request, 'suspicious_url_pattern', { url })
    return true
  }

  // Check user agent
  if (suspiciousPatterns.some(pattern => pattern.test(userAgent))) {
    logSecurityEvent(request, 'suspicious_user_agent', { userAgent })
    return true
  }

  return false
}

/**
 * Validate CORS origin
 */
export const validateOrigin = (origin: string, allowedOrigins: string[] | '*'): boolean => {
  if (allowedOrigins === '*') {
    return true
  }

  return allowedOrigins.includes(origin)
}
