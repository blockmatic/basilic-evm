import { captureError } from '@repo/error/node'
import type { FastifyReply, FastifyRequest } from 'fastify'
import type { Auth } from './auth.js'
import { getSessionFromToken } from './auth-session.js'

type AuthProxyOptions = {
  auth: Auth
  baseUrl: string
  request: FastifyRequest
  reply: FastifyReply
}

const normalizeAuthorizationHeader = (value: string) => {
  if (!value.toLowerCase().startsWith('bearer ')) {
    return value
  }

  const token = value.slice(7).trim()
  const normalizedToken = token.startsWith('Bearer ') ? token.slice(7).trim() : token
  return `Bearer ${normalizedToken}`
}

const getRequestHeaders = ({ request }: { request: FastifyRequest }) => {
  const headers = new Headers()
  for (const [key, val] of Object.entries(request.headers)) {
    if (val == null) {
      continue
    }
    if (key.toLowerCase() === 'cookie') {
      continue
    }
    if (key.toLowerCase() === 'authorization' && typeof val === 'string') {
      headers.set(key, normalizeAuthorizationHeader(val))
      continue
    }
    if (Array.isArray(val)) {
      for (const v of val) {
        headers.append(key, String(v))
      }
    } else {
      headers.append(key, String(val))
    }
  }
  return { headers }
}

const getRequestBody = ({ request }: { request: FastifyRequest }) => {
  const method = request.method.toUpperCase()
  if (method === 'GET' || method === 'HEAD') {
    return { body: undefined, shouldRemoveContentLength: false }
  }

  const contentType = request.headers['content-type']?.toLowerCase() ?? ''
  const rawBody = request.body
  if (!rawBody) {
    return { body: undefined, shouldRemoveContentLength: false }
  }

  if (
    rawBody instanceof Buffer ||
    rawBody instanceof Uint8Array ||
    rawBody instanceof ArrayBuffer ||
    typeof rawBody === 'string'
  ) {
    return { body: rawBody, shouldRemoveContentLength: false }
  }

  if (
    contentType.includes('application/x-www-form-urlencoded') ||
    (typeof rawBody === 'object' &&
      rawBody !== null &&
      !Array.isArray(rawBody) &&
      contentType.includes('form'))
  ) {
    const params = new URLSearchParams()
    for (const [key, value] of Object.entries(rawBody)) {
      if (value != null) {
        params.append(key, String(value))
      }
    }
    return { body: params.toString(), shouldRemoveContentLength: true }
  }

  if (
    contentType.includes('application/json') ||
    (typeof rawBody === 'object' && rawBody !== null)
  ) {
    return { body: JSON.stringify(rawBody), shouldRemoveContentLength: true }
  }

  return { body: String(rawBody), shouldRemoveContentLength: true }
}

const forwardAuthResponse = async ({
  authResponse,
  reply,
}: {
  authResponse: Response
  reply: FastifyReply
}) => {
  reply.status(authResponse.status)
  authResponse.headers.forEach((value: string, key: string) => {
    if (key.toLowerCase() !== 'set-cookie') {
      reply.header(key, value)
    }
  })

  if (!authResponse.body) {
    return null
  }

  const text = await authResponse.text()
  return text
}

const handleMagicLinkVerify = async ({ auth, baseUrl, request, reply }: AuthProxyOptions) => {
  try {
    const verifyUrl = new URL(request.url, baseUrl)

    const verifyHeaders = new Headers()
    verifyHeaders.set('Accept', 'application/json')

    const verifyReq = new Request(verifyUrl.toString(), {
      method: 'GET',
      headers: verifyHeaders,
    })

    const verifyResponse = await auth.handler(verifyReq)

    if (verifyResponse.status !== 200 && verifyResponse.status !== 302) {
      reply.status(verifyResponse.status)
      verifyResponse.headers.forEach((value: string, key: string) => {
        if (key.toLowerCase() !== 'set-cookie') {
          reply.header(key, value)
        }
      })
      const text = verifyResponse.body ? await verifyResponse.text() : null
      return text
    }

    const verifyContentType = verifyResponse.headers.get('content-type') ?? ''
    const verifyData = verifyContentType.includes('application/json')
      ? await verifyResponse.json().catch(() => null)
      : null
    const tokenValue =
      verifyData &&
      typeof verifyData === 'object' &&
      'token' in verifyData &&
      typeof (verifyData as { token?: unknown }).token === 'string'
        ? (verifyData as { token: string }).token
        : null

    if (!tokenValue) {
      reply.status(401).send({ error: 'Failed to create JWT token' })
      return null
    }

    reply
      .status(200)
      .header('Content-Type', 'application/json')
      .send({
        token: normalizeAuthorizationHeader(tokenValue).replace(/^Bearer\s+/i, ''),
      })
    return null
  } catch (error) {
    const catalogError = captureError({
      code: 'INTERNAL_ERROR',
      error: error instanceof Error ? error : new Error(String(error)),
      logger: request.log,
      label: 'magic link JWT verification failed',
      data: {
        method: request.method,
        url: request.url,
      },
      tags: {
        app: 'api',
        module: 'auth-service',
        route: request.url,
      },
    })

    reply.status(500).send({
      code: catalogError.code,
      message: catalogError.message,
    })
    return null
  }
}

const handleAuthProxyRequest = async ({ auth, baseUrl, request, reply }: AuthProxyOptions) => {
  const url = new URL(request.url, baseUrl)
  const { headers } = getRequestHeaders({ request })
  const { body, shouldRemoveContentLength } = getRequestBody({ request })

  if (shouldRemoveContentLength) {
    headers.delete('content-length')
  }

  const req = new Request(url.toString(), {
    method: request.method,
    headers,
    ...(body ? { body } : {}),
  })

  try {
    const authResponse = await auth.handler(req)
    return await forwardAuthResponse({ authResponse, reply })
  } catch (error) {
    const catalogError = captureError({
      code: 'INTERNAL_ERROR',
      error: error instanceof Error ? error : new Error(String(error)),
      logger: request.log,
      label: 'auth.handler failed',
      data: {
        method: request.method,
        url: request.url,
      },
      tags: {
        app: 'api',
        module: 'auth-service',
        route: request.url,
      },
    })

    reply.status(500).send({
      code: catalogError.code,
      message: catalogError.message,
    })
    return null
  }
}

export const proxyBetterAuthRequest = async ({
  auth,
  baseUrl,
  request,
  reply,
}: AuthProxyOptions) => {
  const urlObj = new URL(request.url, baseUrl)
  const isMagicLinkVerify = urlObj.pathname === '/api/auth/magic-link/verify'
  const formatJwt = urlObj.searchParams.get('format') === 'jwt'
  const isGetSession = urlObj.pathname === '/api/auth/get-session'

  if (isGetSession && request.method === 'GET') {
    const authHeader = request.headers.authorization
    if (authHeader?.startsWith('Bearer ')) {
      const token = normalizeAuthorizationHeader(authHeader).replace(/^Bearer\s+/i, '')
      const { session } = await getSessionFromToken({ token })

      reply
        .status(200)
        .header('Content-Type', 'application/json')
        .send(
          session ?? {
            user: null,
            session: null,
          },
        )
      return null
    }
  }

  if (isMagicLinkVerify && formatJwt && request.method === 'GET') {
    return handleMagicLinkVerify({ auth, baseUrl, request, reply })
  }

  return handleAuthProxyRequest({ auth, baseUrl, request, reply })
}
