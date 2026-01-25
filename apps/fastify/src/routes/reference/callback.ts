import type { TypeBoxTypeProvider } from '@fastify/type-provider-typebox'
import { Type } from '@sinclair/typebox'
import type { FastifyPluginAsync } from 'fastify'

const CallbackQuerySchema = Type.Object({
  token: Type.String(),
})

const callbackRoute: FastifyPluginAsync = async fastify => {
  fastify.withTypeProvider<TypeBoxTypeProvider>().get(
    '/callback',
    {
      schema: {
        hide: true,
        tags: ['public'],
        security: [],
        querystring: CallbackQuerySchema,
      },
    },
    async (request, reply) => {
      const { token } = request.query

      if (!token) {
        return reply
          .type('text/html')
          .code(400)
          .send(`
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Authentication Error</title>
</head>
<body>
  <h1>Authentication Error</h1>
  <p>Invalid or missing token</p>
  <script>
    setTimeout(() => window.close(), 2000);
  </script>
</body>
</html>
        `)
      }

      // Verify magic link token and get JWT by calling the verify endpoint directly
      try {
        const verifyResponse = await fastify.inject({
          method: 'POST',
          url: '/auth/magiclink/verify',
          payload: { token },
        })

        if (verifyResponse.statusCode !== 200) {
          throw new Error('Token verification failed')
        }

        const verifyData = verifyResponse.json() as { token: string; refreshToken: string }
        const jwtToken = verifyData.token

        // Return HTML page that sends token to parent window via postMessage
        const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Authentication Success</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      background: #f5f5f5;
    }
    .container {
      background: white;
      padding: 32px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      text-align: center;
    }
    h1 {
      color: #16a34a;
      margin-bottom: 16px;
    }
    p {
      color: #666;
      margin-bottom: 24px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>✓ Authentication Successful</h1>
    <p>You can close this window.</p>
  </div>
  <script>
    // Send token to parent window
    if (window.opener) {
      window.opener.postMessage({
        type: 'SCALAR_AUTH_TOKEN',
        token: '${jwtToken}',
      }, window.location.origin);
      setTimeout(() => window.close(), 1000);
    } else {
      // If opened in same window, redirect back to reference page
      window.location.href = '/reference';
    }
  </script>
</body>
</html>
        `

        return reply.type('text/html').send(html)
      } catch (error) {
        fastify.log.error({ err: error }, 'Failed to verify magic link token')

        return reply
          .type('text/html')
          .code(401)
          .send(`
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Authentication Error</title>
</head>
<body>
  <h1>Authentication Error</h1>
  <p>Failed to verify token. Please try again.</p>
  <script>
    setTimeout(() => window.close(), 2000);
  </script>
</body>
</html>
        `)
      }
    },
  )
}

export default callbackRoute
export const prefixOverride = '/reference'
