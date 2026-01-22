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

    // Handle redirects - Better Auth returns 302 for magic link verification
    // Redirects should go to Next.js frontend, not Fastify backend
    if (response.status === 302 || response.status === 301) {
      const location = response.headers.get('location')
      if (location) {
        // Parse the redirect URL
        let redirectUrl = location

        // If redirect points to Fastify backend, convert to Next.js frontend
        if (location.startsWith(env.NEXT_PUBLIC_API_URL)) {
          // Extract the path from Fastify URL and redirect to Next.js frontend
          const fastifyPath = location.replace(env.NEXT_PUBLIC_API_URL, '')
          redirectUrl = `${new URL(request.url).origin}${fastifyPath}`
        } else if (!location.startsWith('http')) {
          // Relative path - make it absolute to Next.js frontend
          redirectUrl = `${new URL(request.url).origin}${location}`
        }
        // If it's already an absolute URL pointing to Next.js frontend, keep it as is

        // Handle magic link verification - Better Auth redirects with callbackURL or error
        if (path === 'magic-link/verify') {
          try {
            const redirectUrlObj = new URL(redirectUrl)
            const errorParam = redirectUrlObj.searchParams.get('error')

            if (errorParam) {
              // Convert error code to user-friendly message
              const errorMessages: Record<string, string> = {
                INVALID_TOKEN: 'Invalid or expired magic link',
                EXPIRED_TOKEN: 'Magic link has expired',
                TOKEN_NOT_FOUND: 'Magic link not found',
              }
              const errorMessage = errorMessages[errorParam] || 'Invalid or expired magic link'

              // Ensure redirect goes to login page with error message
              const loginUrl = new URL('/', new URL(request.url).origin)
              loginUrl.searchParams.set('message', errorMessage)
              redirectUrl = loginUrl.toString()
            } else {
              // Successful verification - Better Auth redirects to callbackURL
              // The redirectUrl should already be the callbackURL from Better Auth
              // Ensure it's a fully qualified URL pointing to Next.js frontend
              if (!redirectUrl.startsWith('http')) {
                // Relative path - make it absolute to Next.js frontend
                redirectUrl = `${new URL(request.url).origin}${redirectUrl}`
              } else if (redirectUrl.startsWith(env.NEXT_PUBLIC_API_URL)) {
                // If it points to Fastify backend, convert to Next.js frontend
                const fastifyPath = redirectUrl.replace(env.NEXT_PUBLIC_API_URL, '')
                redirectUrl = `${new URL(request.url).origin}${fastifyPath}`
              }
              // If it's already an absolute URL pointing to Next.js frontend, keep it as is

              // Append success message query param to redirect URL
              const redirectUrlObj = new URL(redirectUrl)
              redirectUrlObj.searchParams.set('authenticated', 'true')
              redirectUrl = redirectUrlObj.toString()
            }
          } catch {
            // If URL parsing fails, use original redirectUrl
          }
        }

        responseHeaders.set('Location', redirectUrl)
      }
      return new Response(null, {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
      })
    }

    // Handle magic link verification errors - non-redirect error responses
    if (
      path === 'magic-link/verify' &&
      (response.status === 400 || response.status === 401 || response.status === 404)
    ) {
      let errorMessage = 'Invalid or expired magic link'
      try {
        const errorData = await response.json()
        errorMessage =
          errorData.message ||
          errorData.error?.message ||
          errorData.error ||
          errorData.code ||
          'Invalid or expired magic link'
      } catch {
        // If response is not JSON, use default message
      }

      // Redirect to login with error message
      const loginUrl = new URL('/', new URL(request.url).origin)
      loginUrl.searchParams.set('message', errorMessage)
      return new Response(null, {
        status: 302,
        headers: {
          Location: loginUrl.toString(),
        },
      })
    }

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
