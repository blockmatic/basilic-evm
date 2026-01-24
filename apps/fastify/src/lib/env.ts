import { createEnv } from '@t3-oss/env-core'
import { z } from 'zod'

export const env = createEnv({
  server: {
    PORT: z.coerce.number().int().positive().default(3001),
    HOST: z.string().default('0.0.0.0'),
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PGLITE: z.coerce.boolean().default(false),
    DATABASE_URL: z
      .string()
      .optional()
      .transform(val => {
        // Note: Must check process.env.PGLITE here because env.PGLITE isn't available during transform phase
        if (process.env.PGLITE === 'true' && !val) {
          return 'postgresql://localhost/test'
        }
        return val ?? ''
      })
      .refine(
        val => {
          // When PGLITE is not true, DATABASE_URL must be non-empty
          if (process.env.PGLITE !== 'true') {
            return val !== undefined && val.length > 0
          }
          return true
        },
        {
          message: 'DATABASE_URL is required when PGLITE is not enabled',
        },
      ),
    REDIS_URL: z.string().min(1).optional(),
    SENTRY_DSN: z.string().min(1).optional(),
    SENTRY_ENVIRONMENT: z.string().min(1).optional(),
    SENTRY_TRACES_SAMPLE_RATE: z.coerce.number().min(0).max(1).default(1),
    SENTRY_REPLACES_HEADERS: z.coerce.boolean().default(false),
    SENTRY_REPLACES_PROD_ENV: z.coerce.boolean().default(false),
    // Security configuration
    ALLOWED_ORIGINS: z
      .string()
      .default('*')
      .transform(val => (val === '*' ? '*' : val.split(',').map(origin => origin.trim()))),
    RATE_LIMIT_MAX: z.coerce.number().int().positive().default(100),
    RATE_LIMIT_TIME_WINDOW: z.coerce.number().int().positive().default(60000),
    TRUST_PROXY: z.coerce.boolean().default(true),
    SECURITY_HEADERS_ENABLED: z.coerce.boolean().default(true),
    BODY_LIMIT: z.coerce.number().int().positive().default(1048576), // 1MB default
    REQUEST_TIMEOUT: z.coerce.number().int().positive().default(30000), // 30s default
    // Logging configuration
    LOG_ENABLED: z.coerce.boolean().optional(),
    LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error', 'silent']).default('info'),
    LOG_SERVICE: z.string().optional(),
    // AI configuration
    OPENAI_API_KEY: z.string().min(1),
    ENCRYPTION_KEY: z
      .string()
      .length(64)
      .regex(/^[0-9a-fA-F]+$/, 'Must be a 32-byte hex string'),
    // Auth configuration
    BETTER_AUTH_SECRET: z.string().min(32),
    // JWT configuration
    JWT_SECRET: z
      .string()
      .min(32)
      .optional()
      .transform(val => val ?? process.env.BETTER_AUTH_SECRET ?? ''),
    ACCESS_JWT_EXPIRES_IN_SECONDS: z.coerce.number().int().positive().default(900), // 15 minutes
    REFRESH_JWT_EXPIRES_IN_SECONDS: z.coerce.number().int().positive().default(604800), // 7 days
    JWT_ISSUER: z.string().default('api.yourapp.com'),
    JWT_AUDIENCE: z
      .string()
      .default('api.yourapp.com')
      .transform(val => val.split(',').map(aud => aud.trim())),
    MAGIC_LINK_CALLBACK_HOST_ALLOWLIST: z
      .string()
      .optional()
      .transform(val => (val ? val.split(',').map(host => host.trim()) : undefined)),
    BETTER_AUTH_URL: z
      .string()
      .optional()
      .transform((val): string => {
        // Use VERCEL_URL if available (Vercel deployments)
        if (process.env.VERCEL_URL) {
          return `https://${process.env.VERCEL_URL}`
        }
        // Fallback to explicit env var if set
        if (val) {
          return val
        }
        // For local development, Better Auth baseURL should be the frontend URL (port 3000)
        // even though Fastify runs on port 3001, because auth endpoints are proxied through Next.js
        // This ensures cookies are set for the correct domain
        return 'http://localhost:3000'
      })
      .pipe(z.string().url()),
    BETTER_AUTH_TRUSTED_ORIGINS: z
      .string()
      .default('')
      .transform(val => {
        const origins: string[] = []

        // Include VERCEL_URL if available
        if (process.env.VERCEL_URL) {
          origins.push(`https://${process.env.VERCEL_URL}`)
        }

        // Include explicitly set origins from env var
        const explicitOrigins = val
          .split(',')
          .map(origin => origin.trim())
          .filter(Boolean)
        origins.push(...explicitOrigins)

        // For local development, include both frontend (3000) and backend (3001) origins
        // Frontend origin is where auth endpoints are publicly accessible
        // Backend origin is where Better Auth actually runs
        const frontendOrigin = 'http://localhost:3000'
        const backendPort = process.env.PORT || '3001'
        const backendOrigin = `http://localhost:${backendPort}`

        if (!origins.includes(frontendOrigin)) {
          origins.push(frontendOrigin)
        }
        if (!origins.includes(backendOrigin)) {
          origins.push(backendOrigin)
        }

        return origins
      }),
    // Email configuration
    RESEND_API_KEY: z.string().min(1),
    EMAIL_FROM: z.string().email(),
    EMAIL_FROM_NAME: z.string().default('App'),
    USE_FAKE_EMAIL: z.coerce.boolean().default(false),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
})
