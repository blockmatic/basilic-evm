/**
 * Client-side JWT token storage utilities
 * Uses localStorage for persistence (Browser API - requires client-side)
 */

import { logger } from '@repo/utils/logger'

const TOKEN_KEY = 'better-auth.jwt_token'

/**
 * Store JWT token in localStorage
 * Safe for SSR - checks for window before accessing localStorage
 */
export function storeAuthToken(token: string): void {
  if (typeof window === 'undefined') {
    return
  }
  try {
    localStorage.setItem(TOKEN_KEY, token)
  } catch (error) {
    // localStorage might be disabled or full
    logger.error({ error }, 'Failed to store auth token')
  }
}

/**
 * Retrieve JWT token from localStorage
 * Returns null if token doesn't exist or if called server-side
 */
export function getAuthToken(): string | null {
  if (typeof window === 'undefined') {
    return null
  }
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

/**
 * Remove JWT token from localStorage (for logout)
 */
export function clearAuthToken(): void {
  if (typeof window === 'undefined') {
    return
  }
  try {
    localStorage.removeItem(TOKEN_KEY)
  } catch (error) {
    logger.error({ error }, 'Failed to clear auth token')
  }
}

/**
 * Check if JWT token exists in localStorage
 */
export function hasAuthToken(): boolean {
  return getAuthToken() !== null
}

/**
 * Parse JWT payload to extract expiration date
 * Returns null if token is invalid or doesn't have expiration
 */
export function getTokenExpiration(token: string): Date | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) {
      return null
    }
    const payload = JSON.parse(atob(parts[1] || ''))
    if (payload.exp && typeof payload.exp === 'number') {
      // JWT exp is in seconds, convert to milliseconds
      return new Date(payload.exp * 1000)
    }
    return null
  } catch {
    return null
  }
}

/**
 * Check if JWT token is expired
 * Returns true if token is expired or invalid
 */
export function isTokenExpired(token: string): boolean {
  const expiration = getTokenExpiration(token)
  if (!expiration) {
    // If we can't parse expiration, consider it expired for safety
    return true
  }
  return expiration.getTime() < Date.now()
}
