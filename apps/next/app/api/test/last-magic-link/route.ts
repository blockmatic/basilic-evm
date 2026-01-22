import { env } from '@/lib/env'

export async function GET(): Promise<Response> {
  // Only available in test/development environments (for E2E tests)
  const allowedEnvs = ['test', 'development']
  if (!process.env.NODE_ENV || !allowedEnvs.includes(process.env.NODE_ENV)) {
    return new Response(JSON.stringify({ error: 'Not available in non-test environment' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    // Call Fastify test endpoint to get last magic link token
    const response = await fetch(`${env.NEXT_PUBLIC_API_URL}/api/test/last-magic-link`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      return new Response(JSON.stringify({ error: 'Failed to get magic link token' }), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const data = await response.json()
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: 'Failed to connect to test endpoint',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    )
  }
}
