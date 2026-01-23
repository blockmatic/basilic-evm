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

  // Log incoming cookies for auth endpoints
  if (path === 'magic-link/verify' || path === 'get-session') {
    const incomingCookies = request.headers.get('cookie') || ''
    logger.info(
      {
        path,
        requestUrl: request.url,
        targetUrl,
        incomingCookies: incomingCookies.substring(0, 300),
        hasCookies: !!incomingCookies,
        cookieHeader: incomingCookies,
      },
      `API route: ${path} request received`,
    )
  }

  // Get request body if present
  let body: BodyInit | undefined
  const contentType = request.headers.get('content-type')
  if (request.method !== 'GET' && request.method !== 'HEAD' && contentType) {
    body = await request.text()
  }

  try {
    logger.debug(
      {
        path,
        method: request.method,
        targetUrl,
        hasBody: !!body,
        requestHeaders: Object.fromEntries(headers.entries()),
      },
      'API route: Proxying request to Fastify',
    )

    // Proxy request to Fastify
    const response = await fetch(targetUrl, {
      method: request.method,
      headers,
      body,
    })

    logger.info(
      {
        path,
        status: response.status,
        statusText: response.statusText,
        hasSetCookie: response.headers.has('set-cookie'),
        setCookieCount: response.headers.getSetCookie().length,
        setCookies: response.headers.getSetCookie().map(c => c.substring(0, 150)),
        location: response.headers.get('location'),
        responseHeaders: Object.fromEntries(response.headers.entries()),
      },
      'API route: Received response from Fastify',
    )

    // Prepare response headers
    const responseHeaders = new Headers()

    // Forward all response headers, especially Set-Cookie
    response.headers.forEach((value, key) => {
      // Handle Set-Cookie specially - it can have multiple values
      if (key.toLowerCase() === 'set-cookie') {
        // getSetCookie() returns all Set-Cookie headers as an array
        const setCookies = response.headers.getSetCookie()
        logger.debug(
          { path, setCookieCount: setCookies.length, setCookies },
          'API route: Processing Set-Cookie headers',
        )
        setCookies.forEach(cookie => {
          // Fix cookie domain/path if needed for Next.js frontend
          // Better Auth might set domain for Fastify backend, we need it for Next.js frontend
          let fixedCookie = cookie

          // Remove domain attribute if it points to Fastify backend or wrong domain
          // Cookies without explicit domain work for current origin (localhost:3000)
          const url = new URL(request.url)
          const currentDomain = url.hostname

          // If cookie has Domain attribute pointing to Fastify backend, remove it
          if (cookie.includes('Domain=')) {
            const domainMatch = cookie.match(/Domain=([^;]+)/i)
            if (domainMatch) {
              const cookieDomain = domainMatch[1].trim()
              // If domain doesn't match current domain, remove Domain attribute
              // This allows cookie to work for current origin
              if (cookieDomain !== currentDomain && cookieDomain !== `.${currentDomain}`) {
                fixedCookie = cookie.replace(/Domain=[^;]+;?\s*/gi, '')
                logger.info(
                  {
                    originalCookie: cookie.substring(0, 200),
                    fixedCookie: fixedCookie.substring(0, 200),
                    cookieDomain,
                    currentDomain,
                  },
                  'API route: Fixed cookie domain',
                )
              }
            }
          }

          logger.info(
            {
              path,
              cookieName: cookie.split('=')[0],
              cookieFull: fixedCookie.substring(0, 200),
              willAppend: true,
            },
            'API route: Appending Set-Cookie header',
          )

          responseHeaders.append('Set-Cookie', fixedCookie)
        })
      } else {
        responseHeaders.set(key, value)
      }
    })

    logger.debug(
      {
        path,
        forwardedHeaders: Object.fromEntries(responseHeaders.entries()),
      },
      'API route: Prepared response headers',
    )

    // Handle redirects - Better Auth returns 302 for magic link verification
    // Redirects should go to Next.js frontend, not Fastify backend
    if (response.status === 302 || response.status === 301) {
      const location = response.headers.get('location')
      const setCookies = response.headers.getSetCookie()

      const cookiesInResponseHeaders = responseHeaders.getSetCookie()
      logger.info(
        {
          path,
          status: response.status,
          location,
          setCookieCountFromFastify: setCookies.length,
          setCookiesFromFastify: setCookies.map(c => c.substring(0, 250)),
          setCookieCountInResponseHeaders: cookiesInResponseHeaders.length,
          setCookiesInResponseHeaders: cookiesInResponseHeaders.map(c => c.substring(0, 250)),
          hasSetCookieInResponse: response.headers.has('set-cookie'),
          allFastifyHeaders: Array.from(response.headers.entries()).map(([k, v]) => ({
            key: k,
            value: k.toLowerCase() === 'set-cookie' ? '[...]' : v.substring(0, 100),
          })),
        },
        'API route: Received redirect response from Better Auth',
      )

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

            logger.debug(
              { redirectUrl, errorParam, path, setCookieCount: setCookies.length },
              'API route: Processing magic link verify redirect',
            )

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
              logger.debug(
                { loginUrl: redirectUrl.toString() },
                'API route: Redirecting to login with error',
              )
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
              logger.debug(
                { finalRedirectUrl: redirectUrl, setCookieCount: setCookies.length },
                'API route: Redirecting to dashboard with success',
              )
            }
          } catch (error) {
            // If URL parsing fails, use original redirectUrl
            logger.error({ error, redirectUrl }, 'API route: Failed to parse redirect URL')
          }
        }

        responseHeaders.set('Location', redirectUrl)
      }

      // Ensure Set-Cookie headers are forwarded (they should already be in responseHeaders from earlier)
      // But log to verify they're being set
      const forwardedCookies = responseHeaders.getSetCookie()
      const originalCookies = response.headers.getSetCookie()

      // CRITICAL: Ensure Set-Cookie headers are present in redirect response
      // If they weren't copied earlier, copy them now
      if (forwardedCookies.length === 0 && originalCookies.length > 0) {
        logger.warn(
          { path, originalCookieCount: originalCookies.length },
          'API route: Set-Cookie headers missing in redirect, copying now',
        )
        originalCookies.forEach(cookie => {
          // Fix cookie domain if needed (same logic as above)
          let fixedCookie = cookie
          const url = new URL(request.url)
          const currentDomain = url.hostname

          if (cookie.includes('Domain=')) {
            const domainMatch = cookie.match(/Domain=([^;]+)/i)
            if (domainMatch) {
              const cookieDomain = domainMatch[1].trim()
              if (cookieDomain !== currentDomain && cookieDomain !== `.${currentDomain}`) {
                fixedCookie = cookie.replace(/Domain=[^;]+;?\s*/gi, '')
              }
            }
          }

          responseHeaders.append('Set-Cookie', fixedCookie)
        })
      }

      const finalCookies = responseHeaders.getSetCookie()
      logger.info(
        {
          path,
          status: response.status,
          location: responseHeaders.get('Location'),
          originalCookieCount: originalCookies.length,
          forwardedCookieCount: finalCookies.length,
          finalCookies: finalCookies.map(c => c.substring(0, 250)),
          allResponseHeaders: Array.from(responseHeaders.entries()).map(([k, v]) => ({
            key: k,
            value: k.toLowerCase() === 'set-cookie' ? v.substring(0, 200) : v,
          })),
        },
        'API route: Final redirect response with cookies',
      )

      return new Response(null, {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
      })
    }

    // Handle magic link verification - Better Auth might return 200 with redirect in body
    // or error status codes
    if (path === 'magic-link/verify') {
      logger.debug(
        { status: response.status, path },
        'API route: Processing magic link verify response',
      )

      // Check if this is a JWT format request
      const requestUrl = new URL(request.url)
      const formatJwt = requestUrl.searchParams.get('format') === 'jwt'

      // Handle JWT format response (200 with JSON token)
      if (formatJwt && response.status === 200) {
        try {
          const tokenData = await response.json()
          if (tokenData.token && typeof tokenData.token === 'string') {
            logger.debug(
              { hasToken: !!tokenData.token, tokenLength: tokenData.token.length },
              'API route: JWT format request - returning token',
            )
            // Return token directly, no cookies/redirects
            return new Response(JSON.stringify({ token: tokenData.token }), {
              status: 200,
              headers: {
                'Content-Type': 'application/json',
              },
            })
          }
        } catch (error) {
          logger.error({ error, path }, 'API route: Failed to parse JWT token response')
          // Fall through to error handling
        }
      }

      // Handle error responses
      if (response.status === 400 || response.status === 401 || response.status === 404) {
        let errorMessage = 'Invalid or expired magic link'
        try {
          const errorData = await response.json()
          errorMessage =
            errorData.message ||
            errorData.error?.message ||
            errorData.error ||
            errorData.code ||
            'Invalid or expired magic link'
          logger.debug({ errorData, errorMessage }, 'API route: Magic link verify error response')
        } catch {
          // If response is not JSON, use default message
        }

        // Redirect to login with error message
        const loginUrl = new URL('/', new URL(request.url).origin)
        loginUrl.searchParams.set('message', errorMessage)
        logger.debug(
          { loginUrl: loginUrl.toString() },
          'API route: Redirecting to login with error',
        )
        return new Response(null, {
          status: 302,
          headers: {
            Location: loginUrl.toString(),
          },
        })
      }

      // Handle 200 success response - Better Auth might return HTML with redirect or JSON
      // Skip JWT format requests (already handled above)
      if (response.status === 200 && !formatJwt) {
        // Check if response contains a redirect URL in query params first
        const requestUrlForCallback = new URL(request.url)
        const callbackURL = requestUrlForCallback.searchParams.get('callbackURL')

        if (callbackURL) {
          // Better Auth sets the session cookie and expects client-side redirect
          // We need to redirect to the callbackURL
          let redirectUrl = callbackURL

          // Ensure it's a fully qualified URL pointing to Next.js frontend
          if (!redirectUrl.startsWith('http')) {
            // Relative path - make it absolute to Next.js frontend
            redirectUrl = `${new URL(request.url).origin}${redirectUrl}`
          } else if (redirectUrl.startsWith(env.NEXT_PUBLIC_API_URL)) {
            // If it points to Fastify backend, convert to Next.js frontend
            const fastifyPath = redirectUrl.replace(env.NEXT_PUBLIC_API_URL, '')
            redirectUrl = `${new URL(request.url).origin}${fastifyPath}`
          }

          // Append success message query param to redirect URL
          const redirectUrlObj = new URL(redirectUrl)
          redirectUrlObj.searchParams.set('authenticated', 'true')
          redirectUrl = redirectUrlObj.toString()

          logger.debug(
            { callbackURL, finalRedirectUrl: redirectUrl },
            'API route: Redirecting to callbackURL with success',
          )

          // Forward Set-Cookie headers from Better Auth response
          const setCookies = response.headers.getSetCookie()
          const redirectHeaders = new Headers()
          setCookies.forEach(cookie => {
            redirectHeaders.append('Set-Cookie', cookie)
          })
          redirectHeaders.set('Location', redirectUrl)

          return new Response(null, {
            status: 302,
            headers: redirectHeaders,
          })
        }

        // If no callbackURL, check response body for redirect info
        // Clone response to read body without consuming original
        const clonedResponse = response.clone()
        const contentType = clonedResponse.headers.get('content-type') || ''
        const responseBody = await clonedResponse.text()

        logger.info(
          {
            contentType,
            bodyLength: responseBody.length,
            bodyPreview: responseBody.substring(0, 1000),
            path,
            hasSetCookie: response.headers.has('set-cookie'),
            setCookieCount: response.headers.getSetCookie().length,
            setCookies: response.headers.getSetCookie().map(c => c.substring(0, 200)),
            allResponseHeaders: Object.fromEntries(response.headers.entries()),
          },
          'API route: Magic link verify returned 200 without callbackURL',
        )

        // Better Auth might return HTML with meta refresh or script redirect
        if (contentType.includes('text/html')) {
          // Check for meta refresh or script redirect in HTML
          const metaRefreshMatch = responseBody.match(
            /<meta[^>]*http-equiv=["']refresh["'][^>]*content=["']\d+;\s*url=([^"']+)["']/i,
          )

          // Check for JavaScript redirect in HTML
          const scriptRedirectMatch =
            responseBody.match(/window\.location\.href\s*=\s*["']([^"']+)["']/i) ||
            responseBody.match(/window\.location\s*=\s*["']([^"']+)["']/i)

          // Check for data-redirect-url attribute or similar
          const dataRedirectMatch = responseBody.match(/data-redirect-url=["']([^"']+)["']/i)

          logger.info(
            {
              metaRefreshMatch: metaRefreshMatch?.[1],
              scriptRedirectMatch: scriptRedirectMatch?.[1],
              dataRedirectMatch: dataRedirectMatch?.[1],
              hasSetCookie: response.headers.has('set-cookie'),
              setCookieCount: response.headers.getSetCookie().length,
            },
            'API route: Analyzing HTML response for redirect patterns',
          )

          if (metaRefreshMatch) {
            let redirectUrl = metaRefreshMatch[1]
            if (!redirectUrl.startsWith('http')) {
              redirectUrl = `${new URL(request.url).origin}${redirectUrl}`
            }
            logger.debug({ redirectUrl }, 'API route: Found meta refresh redirect in HTML')
            const setCookies = response.headers.getSetCookie()
            const redirectHeaders = new Headers()
            setCookies.forEach(cookie => {
              redirectHeaders.append('Set-Cookie', cookie)
            })
            redirectHeaders.set('Location', redirectUrl)
            return new Response(null, {
              status: 302,
              headers: redirectHeaders,
            })
          }

          // If Better Auth returned HTML but no cookies, the token might be valid
          // but cookies aren't being set due to domain/origin mismatch
          // In this case, we should still redirect to callbackURL if available
          const requestUrlForHtmlCallback = new URL(request.url)
          const callbackURL = requestUrlForHtmlCallback.searchParams.get('callbackURL')
          if (callbackURL) {
            logger.warn(
              {
                callbackURL,
                hasSetCookie: response.headers.has('set-cookie'),
                setCookieCount: response.headers.getSetCookie().length,
                message: 'Better Auth returned HTML but no cookies - redirecting anyway',
              },
              'API route: HTML response without cookies, redirecting to callbackURL',
            )

            let redirectUrl = callbackURL
            if (!redirectUrl.startsWith('http')) {
              redirectUrl = `${new URL(request.url).origin}${redirectUrl}`
            } else if (redirectUrl.startsWith(env.NEXT_PUBLIC_API_URL)) {
              const fastifyPath = redirectUrl.replace(env.NEXT_PUBLIC_API_URL, '')
              redirectUrl = `${new URL(request.url).origin}${fastifyPath}`
            }

            const redirectUrlObj = new URL(redirectUrl)
            redirectUrlObj.searchParams.set('authenticated', 'true')
            redirectUrl = redirectUrlObj.toString()

            // Forward any cookies that were set (even if empty)
            const setCookies = response.headers.getSetCookie()
            const redirectHeaders = new Headers()
            setCookies.forEach(cookie => {
              redirectHeaders.append('Set-Cookie', cookie)
            })
            redirectHeaders.set('Location', redirectUrl)

            return new Response(null, {
              status: 302,
              headers: redirectHeaders,
            })
          }
        }
      }
    }

    // Get response body (only if not already consumed)
    const responseBody = await response.text()

    // Log get-session responses for debugging
    if (path === 'get-session') {
      logger.debug(
        {
          path,
          status: response.status,
          bodyLength: responseBody.length,
          bodyPreview: responseBody.substring(0, 500),
          responseHeaders: Object.fromEntries(responseHeaders.entries()),
          setCookieCount: responseHeaders.getSetCookie().length,
        },
        'API route: get-session response',
      )
    }

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
