import { logger } from '@repo/utils/logger'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { captureError } from '../capture.js'
import { clearRegistry, registerErrors } from '../registry.js'

// Mock logger
vi.mock('@repo/utils/logger', () => ({
  logger: {
    child: vi.fn(() => ({
      error: vi.fn(),
      warn: vi.fn(),
    })),
    warn: vi.fn(),
  },
}))

// Mock Sentry
const mockCaptureException = vi.fn()
const mockGetClient = vi.fn<() => unknown>(() => ({}))

vi.mock('@sentry/node', () => ({
  getClient: mockGetClient,
  captureException: mockCaptureException,
}))

vi.mock('@sentry/nextjs', () => ({
  getClient: mockGetClient,
  captureException: mockCaptureException,
}))

describe('capture', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetClient.mockReturnValue({})
    clearRegistry()
  })

  describe('captureError', () => {
    it('should return catalog error for registered code', () => {
      registerErrors({
        TEST_ERROR: {
          code: 'TEST_ERROR',
          message: 'Test error message',
        },
      })

      const result = captureError({
        code: 'TEST_ERROR',
        error: new Error('Real error'),
        label: 'Test',
        tags: { app: 'test' },
      })

      expect(result).toEqual({
        code: 'TEST_ERROR',
        message: 'Test error message',
      })
    })

    it('should return fallback for unregistered code', () => {
      const result = captureError({
        code: 'UNREGISTERED_ERROR',
        error: new Error('Real error'),
        label: 'Test',
        tags: { app: 'test' },
      })

      expect(result).toEqual({
        code: 'UNEXPECTED_ERROR',
        message: 'An unexpected error occurred',
      })
    })

    it('should log error via logger', () => {
      registerErrors({
        TEST_ERROR: {
          code: 'TEST_ERROR',
          message: 'Test error message',
        },
      })

      captureError({
        code: 'TEST_ERROR',
        error: new Error('Real error'),
        label: 'Test Label',
        tags: { app: 'test' },
        data: { extra: 'data' },
      })

      expect(logger.child).toHaveBeenCalledWith({
        errorCode: 'TEST_ERROR',
        label: 'Test Label',
        app: 'test',
      })
    })

    it('should capture to Sentry asynchronously', async () => {
      registerErrors({
        TEST_ERROR: {
          code: 'TEST_ERROR',
          message: 'Test error message',
        },
      })

      const error = new Error('Real error')
      captureError({
        code: 'TEST_ERROR',
        error,
        label: 'Test',
        tags: { app: 'test', module: 'test-module' },
        data: { extra: 'data' },
        level: 'warning',
      })

      // Wait for setImmediate to execute
      await new Promise(resolve => setImmediate(resolve))

      expect(mockCaptureException).toHaveBeenCalledWith(error, {
        tags: {
          errorCode: 'TEST_ERROR',
          component: 'Test',
          app: 'test',
          module: 'test-module',
        },
        level: 'warning',
        contexts: {
          error: {
            code: 'TEST_ERROR',
            label: 'Test',
            extra: 'data',
          },
        },
      })
    })

    it('should handle non-Error objects', async () => {
      registerErrors({
        TEST_ERROR: {
          code: 'TEST_ERROR',
          message: 'Test error message',
        },
      })

      captureError({
        code: 'TEST_ERROR',
        error: 'String error',
        label: 'Test',
        tags: { app: 'test' },
      })

      await new Promise(resolve => setImmediate(resolve))

      expect(mockCaptureException).toHaveBeenCalledWith(expect.any(Error), expect.any(Object))
    })

    it('should handle Sentry not initialized gracefully', async () => {
      mockGetClient.mockReturnValue(null)

      registerErrors({
        TEST_ERROR: {
          code: 'TEST_ERROR',
          message: 'Test error message',
        },
      })

      const result = captureError({
        code: 'TEST_ERROR',
        error: new Error('Real error'),
        label: 'Test',
        tags: { app: 'test' },
      })

      await new Promise(resolve => setImmediate(resolve))

      // Should still return catalog error
      expect(result).toEqual({
        code: 'TEST_ERROR',
        message: 'Test error message',
      })

      // Should not throw
      expect(mockCaptureException).not.toHaveBeenCalled()
    })
  })
})
