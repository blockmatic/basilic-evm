'use client'

import { useSession } from '@repo/react'
import { logger } from '@repo/utils/logger'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect } from 'react'

export function AuthCallbackClient() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Get server-injected error from URL params (set by API route on invalid token)
  const error = searchParams.get('error') || searchParams.get('message')

  // Use TanStack Query to check session status
  const {
    data: session,
    isLoading,
    isError,
  } = useSession({
    retry: false,
    refetchOnWindowFocus: false,
  })

  // Type guard to ensure session has the expected shape
  const hasValidSession =
    session && typeof session === 'object' && 'user' in session && session.user !== null

  useEffect(() => {
    logger.debug(
      {
        error,
        isLoading,
        isError,
        hasValidSession,
        sessionExists: !!session,
        pathname: window.location.pathname,
        search: window.location.search,
      },
      'AuthCallbackClient: State change',
    )

    if (error) {
      // Server-injected error - redirect to login with error message
      logger.debug({ error }, 'AuthCallbackClient: Redirecting to login with error')
      const timeoutId = setTimeout(() => {
        router.push(`/?message=${encodeURIComponent(error)}`)
      }, 2000)
      return () => clearTimeout(timeoutId)
    }

    if (!isLoading && !isError && hasValidSession) {
      // Session exists - redirect to dashboard
      logger.debug({ session }, 'AuthCallbackClient: Session valid, redirecting to dashboard')
      const timeoutId = setTimeout(() => {
        router.push('/dashboard?authenticated=true')
      }, 500)
      return () => clearTimeout(timeoutId)
    }

    if (!isLoading && (isError || !hasValidSession)) {
      // No session - redirect to login
      logger.debug(
        { isError, hasValidSession, session },
        'AuthCallbackClient: No valid session, redirecting to login',
      )
      const timeoutId = setTimeout(() => {
        router.push('/')
      }, 1000)
      return () => clearTimeout(timeoutId)
    }
  }, [error, isLoading, isError, session, router, hasValidSession])

  // Determine status from query state and server-injected error
  const status: 'loading' | 'success' | 'error' = error
    ? 'error'
    : isLoading
      ? 'loading'
      : hasValidSession
        ? 'success'
        : 'error'

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center space-y-4">
        {status === 'loading' && (
          <>
            <div className="mx-auto size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="text-muted-foreground">Verifying your magic link...</p>
          </>
        )}
        {status === 'success' && (
          <>
            <div className="mx-auto size-8 rounded-full bg-green-500 flex items-center justify-center">
              <svg
                className="size-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <p className="text-muted-foreground">Success! Redirecting to dashboard...</p>
          </>
        )}
        {status === 'error' && (
          <>
            <div className="mx-auto size-8 rounded-full bg-destructive flex items-center justify-center">
              <svg
                className="size-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <p className="text-destructive">
              {error || 'Verification failed. Redirecting to login...'}
            </p>
          </>
        )}
      </div>
    </div>
  )
}
