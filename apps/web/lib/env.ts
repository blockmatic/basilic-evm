import { z } from 'zod'

const envSchema = z.object({
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
  NEXT_PUBLIC_SENTRY_ENVIRONMENT: z.string().optional(),
})

export type Env = z.infer<typeof envSchema>

/**
 * Gets validated environment variables.
 * Returns validated env vars or throws in production if required vars are missing.
 * Note: In Next.js, NEXT_PUBLIC_* variables are replaced at build time.
 */
export function getEnv(): Env {
  const isProduction = process.env.NODE_ENV === 'production'
  const result = envSchema.safeParse(process.env)

  if (!result.success) {
    if (isProduction) {
      throw new Error(`Invalid environment configuration: ${result.error.message}`)
    }
    console.warn('Environment validation warnings:', result.error.errors)
  }

  return result.success ? result.data : ({} as Env)
}

/**
 * Validated environment configuration object.
 * Validated at module load - fails fast if config is invalid in production.
 */
export const zEnv = getEnv()
