import { logger } from '@repo/utils/logger'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { initSentry } from '../sentry.js'

// Mock logger
vi.mock('@repo/utils/logger', () => ({
  logger: {
    warn: vi.fn(),
  },
}))

// Mock Sentry
const mockInit = vi.fn()

vi.mock('@sentry/node', () => ({
  init: mockInit,
}))

vi.mock('@sentry/nextjs', () => ({
  init: mockInit,
}))

describe('sentry', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('initSentry', () => {
    it('should initialize Sentry with default config', () => {
      initSentry({
        dsn: 'https://test@sentry.io/123',
        environment: 'test',
      })

      expect(mockInit).toHaveBeenCalledWith(
        expect.objectContaining({
          dsn: 'https://test@sentry.io/123',
          environment: 'test',
          tracesSampleRate: 1.0,
        }),
      )
    })

    it('should support optional custom beforeSend', () => {
      const customBeforeSend = vi.fn(event => event)

      initSentry({
        dsn: 'https://test@sentry.io/123',
        beforeSend: customBeforeSend,
      })

      expect(mockInit).toHaveBeenCalledWith(
        expect.objectContaining({
          beforeSend: customBeforeSend,
        }),
      )
    })

    it('should warn if DSN is not provided', () => {
      initSentry({ dsn: undefined })

      expect(logger.warn).toHaveBeenCalledWith(
        'Sentry DSN not configured - error reporting disabled',
      )
      expect(mockInit).not.toHaveBeenCalled()
    })

    it('should use production tracesSampleRate for production environment', () => {
      initSentry({
        dsn: 'https://test@sentry.io/123',
        environment: 'production',
      })

      expect(mockInit).toHaveBeenCalledWith(
        expect.objectContaining({
          tracesSampleRate: 0.1,
        }),
      )
    })

    it('should use development tracesSampleRate for non-production', () => {
      initSentry({
        dsn: 'https://test@sentry.io/123',
        environment: 'development',
      })

      expect(mockInit).toHaveBeenCalledWith(
        expect.objectContaining({
          tracesSampleRate: 1.0,
        }),
      )
    })

    it('should include ignoreErrors array', () => {
      initSentry({
        dsn: 'https://test@sentry.io/123',
      })

      expect(mockInit).toHaveBeenCalledWith(
        expect.objectContaining({
          ignoreErrors: expect.arrayContaining([
            'ResizeObserver loop',
            'Non-Error promise rejection',
            'NetworkError',
            'Failed to fetch',
          ]),
        }),
      )
    })
  })
})
