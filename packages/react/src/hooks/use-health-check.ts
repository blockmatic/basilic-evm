import type { createClient } from '@repo/core'
import type { UseQueryOptions } from '@tanstack/react-query'
import { useQuery } from '@tanstack/react-query'
import { useReactApiConfig } from '../context.js'

type Client = ReturnType<typeof createClient>
type HealthCheckParams = Parameters<Client['healthCheck']>[0]
type HealthCheckResponse = Awaited<ReturnType<Client['healthCheck']>>

/**
 * React Query hook for health check endpoint.
 *
 * Fetches server health status with current ISO datetime. Uses the API client
 * configured in `ReactApiProvider` and applies default query options from context.
 *
 * @param params - Optional health check parameters (query params, etc.)
 * @param options - Additional TanStack Query options (merged with context defaults)
 * @returns TanStack Query result with health check data
 *
 * @example
 * ```tsx
 * function HealthStatus() {
 *   const { data, isLoading, error } = useHealthCheck()
 *
 *   if (isLoading) return <div>Checking health...</div>
 *   if (error) return <div>Health check failed</div>
 *
 *   return <div>Server is healthy: {data?.datetime}</div>
 * }
 * ```
 *
 * @example
 * ```tsx
 * // With custom query options
 * const { data } = useHealthCheck(
 *   { query: { include: 'details' } },
 *   { refetchInterval: 30000 }
 * )
 * ```
 */
export function useHealthCheck(
  params?: HealthCheckParams,
  options?: Omit<UseQueryOptions<HealthCheckResponse, Error>, 'queryKey' | 'queryFn'>,
) {
  const { client, queryClientDefaults } = useReactApiConfig()

  return useQuery({
    queryKey: ['healthCheck', params],
    queryFn: () => client.healthCheck(params),
    ...queryClientDefaults,
    ...options,
  })
}
