import { logger } from '@repo/utils/logger'
import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'

import { DashboardContent } from './components/dashboard-content'

async function getSession() {
  try {
    // Get cookies from the incoming request
    const cookieStore = await cookies()
    const allCookies = cookieStore.getAll()
    const cookieHeader = allCookies.map(cookie => `${cookie.name}=${cookie.value}`).join('; ')

    // Get request headers to construct the API URL
    const headersList = await headers()
    const host = headersList.get('host') || 'localhost:3000'
    const protocol = headersList.get('x-forwarded-proto') || 'http'
    const baseUrl = `${protocol}://${host}`
    const apiUrl = `${baseUrl}/api/auth/get-session`

    logger.info(
      {
        cookieCount: allCookies.length,
        hasSessionCookie: cookieStore.has('better-auth.session_token'),
        cookieNames: allCookies.map(c => c.name),
        cookieValues: allCookies.map(c => ({
          name: c.name,
          valueLength: c.value.length,
          valuePreview: c.value.substring(0, 20) + '...',
        })),
        cookieHeaderLength: cookieHeader.length,
        cookieHeaderPreview: cookieHeader.substring(0, 200),
        apiUrl,
        baseUrl,
        host,
        protocol,
      },
      'Dashboard: Starting session check',
    )

    const fetchHeaders: Record<string, string> = {}
    if (cookieHeader) {
      fetchHeaders.Cookie = cookieHeader
    }

    logger.debug(
      {
        apiUrl,
        fetchHeaders,
        hasCookieHeader: !!fetchHeaders.Cookie,
      },
      'Dashboard: Making fetch request',
    )

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: fetchHeaders,
      cache: 'no-store',
    })

    logger.info(
      {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        hasSetCookie: response.headers.has('set-cookie'),
        responseHeaders: Object.fromEntries(response.headers.entries()),
      },
      'Dashboard: Received response',
    )

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

    logger.info(
      {
        hasUser: !!data?.user,
        dataKeys: data ? Object.keys(data) : [],
        userKeys: data?.user ? Object.keys(data.user) : null,
        fullData: JSON.stringify(data).substring(0, 500),
        dataType: typeof data,
        dataIsNull: data === null,
      },
      'Dashboard: Session check result',
    )

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
