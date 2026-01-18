/**
 * In-memory rate limiting utility for API routes and middleware.
 *
 * Uses a sliding window algorithm to track requests per identifier and scope.
 * Suitable for single-instance deployments. For distributed systems, consider
 * using Redis-based rate limiting.
 *
 * @example
 * ```ts
 * import { rateLimit } from '@repo/utils/rate-limit'
 *
 * export async function POST(request: Request) {
 *   const ip = request.headers.get('x-forwarded-for') || 'unknown'
 *   if (!await rateLimit.check(ip, 'login', 5, 60)) {
 *     return new Response('Too many requests', { status: 429 })
 *   }
 *   // Process request
 * }
 * ```
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

/**
 * Checks if a request should be allowed based on rate limiting rules.
 *
 * @param identifier - Unique identifier (e.g., IP address, user ID)
 * @param scope - Rate limit scope/key (e.g., 'login', 'api', 'upload')
 * @param maxRequests - Maximum number of requests allowed
 * @param windowSeconds - Time window in seconds
 * @returns Promise resolving to true if request is allowed, false if rate limited
 */
export async function check(
  identifier: string,
  scope: string,
  maxRequests: number,
  windowSeconds: number,
): Promise<boolean> {
  const key = `${identifier}:${scope}`
  const now = Date.now()
  const windowMs = windowSeconds * 1000

  const entry = store.get(key)

  // No entry or window expired - create new entry
  if (!entry || now >= entry.resetAt) {
    store.set(key, {
      count: 1,
      resetAt: now + windowMs,
    })
    return true
  }

  // Within window - increment count
  entry.count += 1

  // Check if limit exceeded
  if (entry.count > maxRequests) {
    return false
  }

  return true
}

/**
 * Rate limit utility with check method.
 */
export const rateLimit = {
  check,
}
