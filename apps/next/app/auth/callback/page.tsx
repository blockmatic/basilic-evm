import { logger } from '@repo/utils/logger'
import { redirect } from 'next/navigation'
import { env } from '@/lib/env'
import { AuthCallbackClient } from './components/auth-callback-client'
import { StoreTokenClient } from './components/store-token'

type AuthCallbackPageProps = {
  searchParams: Promise<{
    token?: string
    format?: string
    error?: string
    message?: string
  }>
}

export default async function AuthCallbackPage({ searchParams }: AuthCallbackPageProps) {
  const params = await searchParams
  const token = params.token
  const formatJwt = params.format === 'jwt'
  const error = params.error || params.message

  // Handle errors first
  if (error) {
    logger.debug({ error }, 'AuthCallbackPage: Redirecting to login with error')
    redirect(`/?message=${encodeURIComponent(error)}`)
  }

  // Handle JWT format flow
  if (formatJwt && token) {
    try {
      // Fetch JWT token server-side
      const baseUrl = env.NEXT_PUBLIC_API_URL
      const verifyUrl = `${baseUrl}/api/auth/magic-link/verify?token=${encodeURIComponent(token)}&format=jwt`

      logger.debug({ verifyUrl }, 'AuthCallbackPage: Fetching JWT token server-side')

      const response = await fetch(verifyUrl, {
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        logger.error(
          { status: response.status, statusText: response.statusText },
          'AuthCallbackPage: JWT token fetch failed',
        )
        redirect('/?message=Invalid or expired magic link')
      }

      const data = await response.json()
      if (data.token && typeof data.token === 'string') {
        logger.debug(
          { hasToken: !!data.token, tokenLength: data.token.length },
          'AuthCallbackPage: JWT token received, passing to client component',
        )
        // Pass token to client component for localStorage storage
        return <StoreTokenClient token={data.token} />
      }

      logger.error({ data }, 'AuthCallbackPage: Invalid token response format')
      redirect('/?message=Invalid or expired magic link')
    } catch (error) {
      logger.error(
        { error: error instanceof Error ? error.message : String(error) },
        'AuthCallbackPage: Error fetching JWT token',
      )
      redirect('/?message=Failed to verify magic link')
    }
  }

  // Cookie-based flow - use existing client component logic
  return <AuthCallbackClient />
}
