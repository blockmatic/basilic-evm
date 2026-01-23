import { logger } from '@repo/utils/logger'
import { clearServerAuthToken, getServerAuthToken, setServerAuthToken } from '@/lib/auth-server'
import { env } from '@/lib/env'

type RouteContext = {
  params: Promise<{
    path: string[]
  }>
}

type AuthProxyOptions = {
  pathSegments: string[]
  request: Request
}

const buildFastifyUrl = ({ pathSegments, request }: AuthProxyOptions) => {
  const path = pathSegments.join('/')
  const requestUrl = new URL(request.url)
  return {
    path,
    targetUrl: `${env.NEXT_PUBLIC_API_URL}/api/auth/${path}${requestUrl.search}`,
  }
}

const getForwardedHeaders = ({
  request,
  token,
}: Pick<AuthProxyOptions, 'request'> & { token: string | null }) => {
  const requestUrl = new URL(request.url)
  const headers = new Headers()

  request.headers.forEach((value, key) => {
    const lowerKey = key.toLowerCase()
    if (lowerKey !== 'host' && lowerKey !== 'cookie') {
      headers.set(key, value)
    }
  })

  headers.set('x-forwarded-host', requestUrl.host)
  headers.set('x-forwarded-proto', requestUrl.protocol.slice(0, -1))
  headers.set('x-forwarded-for', request.headers.get('x-forwarded-for') || requestUrl.hostname)

  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  return { headers }
}

const getRequestBody = async ({ request }: Pick<AuthProxyOptions, 'request'>) => {
  if (request.method === 'GET' || request.method === 'HEAD') {
    return { body: undefined }
  }

  return { body: await request.text() }
}

const getRedirectUrl = ({
  request,
  callbackURL,
}: {
  request: Request
  callbackURL: string | null
}) => {
  if (callbackURL) {
    const url = new URL(callbackURL, new URL(request.url).origin)
    url.searchParams.set('authenticated', 'true')
    return { redirectUrl: url.toString() }
  }

  const fallbackUrl = new URL('/dashboard', new URL(request.url).origin)
  fallbackUrl.searchParams.set('authenticated', 'true')
  return { redirectUrl: fallbackUrl.toString() }
}

const handleMagicLinkVerify = async ({ pathSegments, request }: AuthProxyOptions) => {
  const { targetUrl } = buildFastifyUrl({ pathSegments, request })
  const requestUrl = new URL(request.url)
  const callbackURL = requestUrl.searchParams.get('callbackURL')
  const token = requestUrl.searchParams.get('token')

  if (!token) {
    const loginUrl = new URL('/', new URL(request.url).origin)
    loginUrl.searchParams.set('message', 'Invalid or expired magic link')
    return new Response(null, {
      status: 302,
      headers: {
        Location: loginUrl.toString(),
      },
    })
  }

  const verifyUrl = new URL(targetUrl)
  verifyUrl.searchParams.set('format', 'jwt')

  try {
    const response = await fetch(verifyUrl.toString(), {
      method: request.method,
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    })

    if (!response.ok) {
      const contentType = response.headers.get('content-type') || ''
      const errorData = contentType.includes('application/json')
        ? await response.json().catch(() => null)
        : null
      const errorMessage =
        typeof errorData?.message === 'string' ? errorData.message : 'Invalid or expired magic link'
      const loginUrl = new URL('/', new URL(request.url).origin)
      loginUrl.searchParams.set('message', errorMessage)
      return new Response(null, {
        status: 302,
        headers: {
          Location: loginUrl.toString(),
        },
      })
    }

    const data = await response.json().catch(() => null)
    if (!data?.token || typeof data.token !== 'string') {
      const loginUrl = new URL('/', new URL(request.url).origin)
      loginUrl.searchParams.set('message', 'Invalid or expired magic link')
      return new Response(null, {
        status: 302,
        headers: {
          Location: loginUrl.toString(),
        },
      })
    }

    await setServerAuthToken({ token: data.token })
    const { redirectUrl } = getRedirectUrl({ request, callbackURL })

    return new Response(null, {
      status: 302,
      headers: {
        Location: redirectUrl,
      },
    })
  } catch (error) {
    logger.error({ error }, 'API auth route: magic link verification failed')
    const loginUrl = new URL('/', new URL(request.url).origin)
    loginUrl.searchParams.set('message', 'Failed to verify magic link')
    return new Response(null, {
      status: 302,
      headers: {
        Location: loginUrl.toString(),
      },
    })
  }
}

const proxyRequest = async ({ pathSegments, request }: AuthProxyOptions) => {
  const { path, targetUrl } = buildFastifyUrl({ pathSegments, request })
  if (path === 'magic-link/verify') {
    return handleMagicLinkVerify({ pathSegments, request })
  }

  const { token } = await getServerAuthToken()
  const isSignOut = path === 'sign-out'
  if (isSignOut) {
    await clearServerAuthToken()
  }

  const { headers } = getForwardedHeaders({ request, token })
  const { body } = await getRequestBody({ request })

  try {
    const response = await fetch(targetUrl, {
      method: request.method,
      headers,
      body,
    })

    const responseHeaders = new Headers()
    response.headers.forEach((value, key) => {
      if (key.toLowerCase() !== 'set-cookie') {
        responseHeaders.set(key, value)
      }
    })

    const prefersHtml = request.headers.get('accept')?.includes('text/html')
    if (isSignOut && request.method === 'GET' && prefersHtml) {
      const redirectUrl = new URL('/', request.url)
      return new Response(null, {
        status: 302,
        headers: {
          Location: redirectUrl.toString(),
        },
      })
    }

    const responseBody = await response.text()
    return new Response(responseBody, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    })
  } catch (error) {
    logger.error({ error, path, targetUrl }, 'API auth route: proxy request failed')
    return new Response(
      JSON.stringify({
        message: 'Failed to connect to authentication service',
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 502,
        statusText: 'Bad Gateway',
        headers: {
          'Content-Type': 'application/json',
        },
      },
    )
  }
}

export async function GET(request: Request, context: RouteContext): Promise<Response> {
  const params = await context.params
  return proxyRequest({ request, pathSegments: params.path })
}

export async function POST(request: Request, context: RouteContext): Promise<Response> {
  const params = await context.params
  return proxyRequest({ request, pathSegments: params.path })
}

export async function PUT(request: Request, context: RouteContext): Promise<Response> {
  const params = await context.params
  return proxyRequest({ request, pathSegments: params.path })
}

export async function PATCH(request: Request, context: RouteContext): Promise<Response> {
  const params = await context.params
  return proxyRequest({ request, pathSegments: params.path })
}

export async function DELETE(request: Request, context: RouteContext): Promise<Response> {
  const params = await context.params
  return proxyRequest({ request, pathSegments: params.path })
}

export async function OPTIONS(request: Request, context: RouteContext): Promise<Response> {
  const params = await context.params
  return proxyRequest({ request, pathSegments: params.path })
}
