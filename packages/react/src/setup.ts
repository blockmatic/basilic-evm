import type { createClient } from '@repo/core'
import type { QueryClient } from '@tanstack/react-query'

export type ReactApiConfig = {
  client: ReturnType<typeof createClient>
  queryClient?: QueryClient
  queryClientDefaults?: {
    retry?: number
    staleTime?: number
  }
}

export type ReactApiConfigValue = {
  client: ReturnType<typeof createClient>
  queryClient?: QueryClient
  queryClientDefaults: {
    retry?: number
    staleTime?: number
  }
}

export function createReactApiConfig(options: ReactApiConfig): ReactApiConfigValue {
  return {
    client: options.client,
    queryClient: options.queryClient,
    queryClientDefaults: options.queryClientDefaults ?? {},
  }
}
