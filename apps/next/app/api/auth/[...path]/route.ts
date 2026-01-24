import { ApiError, createClient } from '@repo/core'
import { logger } from '@repo/utils/logger'
import { clearServerAuthToken, getServerAuthToken, setServerAuthToken } from '@/lib/auth-server'
import { env } from '@/lib/env'

const client = createClient({
  baseUrl: env.NEXT_PUBLIC_API_URL,
})

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

const handleMagicLinkVerify = async ({ request }: Pick<AuthProxyOptions, 'request'>) => {
  const requestUrl = new URL(request.url)
  const callbackURL = requestUrl.searchParams.get('callbackURL')
  const token = requestUrl.searchParams.get('token')

  logger.debug(
    { token: token ? 'present' : 'missing', callbackURL },
    'handleMagicLinkVerify: starting verification',
  )

  if (!token) {
    logger.debug({ callbackURL }, 'handleMagicLinkVerify: no token provided')
    const loginUrl = new URL('/', new URL(request.url).origin)
    loginUrl.searchParams.set('message', 'Invalid or expired magic link')
    return new Response(null, {
      status: 302,
      headers: {
        Location: loginUrl.toString(),
      },
    })
  }

  try {
    logger.debug({ token: 'present' }, 'handleMagicLinkVerify: sending verification request')
    const data = await client.auth.magiclink.verify({ body: { token } })

    logger.debug(
      { hasToken: !!data.token, tokenLength: data.token.length },
      'handleMagicLinkVerify: received response',
    )

    logger.debug(
      { tokenLength: data.token.length },
      'handleMagicLinkVerify: setting server auth token',
    )
    await setServerAuthToken({ token: data.token })
    const { redirectUrl } = getRedirectUrl({ request, callbackURL })
    logger.debug({ redirectUrl }, 'handleMagicLinkVerify: redirecting to success URL')

    return new Response(null, {
      status: 302,
      headers: {
        Location: redirectUrl,
      },
    })
  } catch (error) {
    if (error instanceof ApiError) {
      const errorMessage =
        error.status === 401 || error.status === 404
          ? 'Invalid or expired magic link'
          : error.message || 'Failed to verify magic link'
      logger.debug(
        { status: error.status, errorMessage, errorBody: error.body },
        'handleMagicLinkVerify: API error',
      )
      const loginUrl = new URL('/', new URL(request.url).origin)
      loginUrl.searchParams.set('message', errorMessage)
      return new Response(null, {
        status: 302,
        headers: {
          Location: loginUrl.toString(),
        },
      })
    }

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
    return handleMagicLinkVerify({ request })
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
