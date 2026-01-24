import type { createClient } from '@repo/core'
import type { UseQueryOptions } from '@tanstack/react-query'
import { useQuery } from '@tanstack/react-query'
import { useReactApiConfig } from '../context.js'

type Client = ReturnType<typeof createClient>
type HealthCheckParams = Parameters<Client['healthCheck']>[0]
type HealthCheckResponse = Awaited<ReturnType<Client['healthCheck']>>

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
