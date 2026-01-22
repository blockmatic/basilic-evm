import { logger } from '@repo/utils/logger'
import { env } from '@/lib/env'

type RouteContext = {
  params: Promise<{
    path: string[]
  }>
}

async function proxyRequest(request: Request, pathSegments: string[]): Promise<Response> {
  const path = pathSegments.join('/')
  const fastifyUrl = `${env.NEXT_PUBLIC_API_URL}/api/auth/${path}`

  // Get query string from original request
  const url = new URL(request.url)
  const queryString = url.search
  const targetUrl = `${fastifyUrl}${queryString}`

  // Prepare headers to forward
  const headers = new Headers()

  // Forward all request headers except host
  request.headers.forEach((value, key) => {
    if (key.toLowerCase() !== 'host') {
      headers.set(key, value)
    }
  })

  // Forward x-forwarded-* headers for origin checks
  headers.set('x-forwarded-host', url.host)
  headers.set('x-forwarded-proto', url.protocol.slice(0, -1)) // Remove trailing ':'
  headers.set('x-forwarded-for', request.headers.get('x-forwarded-for') || url.hostname)

  // Get request body if present
  let body: BodyInit | undefined
  const contentType = request.headers.get('content-type')
  if (request.method !== 'GET' && request.method !== 'HEAD' && contentType) {
    body = await request.text()
  }

  try {
    // Proxy request to Fastify
    const response = await fetch(targetUrl, {
      method: request.method,
      headers,
      body,
    })

    // Prepare response headers
    const responseHeaders = new Headers()

    // Forward all response headers, especially Set-Cookie
    response.headers.forEach((value, key) => {
      // Handle Set-Cookie specially - it can have multiple values
      if (key.toLowerCase() === 'set-cookie') {
        // getSetCookie() returns all Set-Cookie headers as an array
        const setCookies = response.headers.getSetCookie()
        setCookies.forEach(cookie => {
          responseHeaders.append('Set-Cookie', cookie)
        })
      } else {
        responseHeaders.set(key, value)
      }
    })

    // Get response body
    const responseBody = await response.text()

    // Return proxied response with all headers preserved
    return new Response(responseBody, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    })
  } catch (error) {
    // Network errors or Fastify unavailable
    logger.error(
      { error, path, targetUrl },
      'Proxy error: Failed to connect to authentication service',
    )
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
  return proxyRequest(request, params.path)
}

export async function POST(request: Request, context: RouteContext): Promise<Response> {
  const params = await context.params
  return proxyRequest(request, params.path)
}

export async function PUT(request: Request, context: RouteContext): Promise<Response> {
  const params = await context.params
  return proxyRequest(request, params.path)
}

export async function PATCH(request: Request, context: RouteContext): Promise<Response> {
  const params = await context.params
  return proxyRequest(request, params.path)
}

export async function DELETE(request: Request, context: RouteContext): Promise<Response> {
  const params = await context.params
  return proxyRequest(request, params.path)
}

export async function OPTIONS(request: Request, context: RouteContext): Promise<Response> {
  const params = await context.params
  return proxyRequest(request, params.path)
}
