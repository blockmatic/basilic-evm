import { logger } from '@repo/utils/logger'
import { redirect } from 'next/navigation'
import { getServerAuthToken } from '@/lib/auth-server'
import { env } from '@/lib/env'

import { DashboardContent } from './components/dashboard-content'

async function getSession() {
  try {
    const { token } = await getServerAuthToken()
    if (!token) {
      return null
    }

    const response = await fetch(`${env.NEXT_PUBLIC_API_URL}/api/auth/get-session`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => '')
      logger.debug(
        {
          status: response.status,
          statusText: response.statusText,
          errorText: errorText.substring(0, 500),
          responseHeaders: Object.fromEntries(response.headers.entries()),
        },
        'Dashboard: Session check failed',
      )
      return null
    }

    const data = await response.json().catch(() => null)

    if (!data) {
      logger.debug({ status: response.status }, 'Dashboard: Response body is null or invalid JSON')
      return null
    }

    return data?.user ?? null
  } catch (error) {
    logger.error(
      {
        error: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack : undefined,
        errorName: error instanceof Error ? error.name : undefined,
        errorCause: error instanceof Error ? error.cause : undefined,
      },
      'Dashboard: Session check error',
    )
    return null
  }
}

type DashboardPageProps = {
  searchParams: Promise<{
    authenticated?: string
    message?: string
  }>
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const user = await getSession()

  if (!user) {
    redirect('/')
  }

  const params = await searchParams
  const showSuccessMessage = params.authenticated === 'true' || params.message === 'success'

  return <DashboardContent user={user} showSuccessMessage={showSuccessMessage} />
}
