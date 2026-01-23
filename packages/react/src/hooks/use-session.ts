import type { UseQueryOptions } from '@tanstack/react-query'
import { useQuery } from '@tanstack/react-query'
import { useReactApiConfig } from '../context.js'
import { getApiAuthBy__ } from '../gen/index.js'

type SessionResponse = {
  user: {
    id: string
    email: string | null
    name: string | null
    emailVerified: boolean
    image: string | null
  } | null
  session: {
    id: string
    userId: string
    expiresAt: string
  } | null
}

export function useSession(
  options?: Omit<UseQueryOptions<SessionResponse, Error>, 'queryKey' | 'queryFn'>,
) {
  const { client, getAuthHeaders, queryClientDefaults } = useReactApiConfig()

  return useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      const headers = await getAuthHeaders()
      const response = await getApiAuthBy__({
        client,
        path: { '*': 'get-session' },
        ...(Object.keys(headers).length > 0 && { headers }),
      })

      if (!response.data) {
        throw new Error('Failed to get session')
      }

      return response.data as SessionResponse
    },
    ...queryClientDefaults,
    ...options,
  })
}
