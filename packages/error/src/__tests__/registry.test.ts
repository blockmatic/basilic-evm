import { describe, expect, it } from 'vitest'
import { getError, registerErrors } from '../registry.js'
import type { CatalogError } from '../types.js'

describe('registry', () => {
  describe('registerErrors', () => {
    it('should register valid error codes', () => {
      const errors: Record<string, CatalogError> = {
        VALID_ERROR: {
          code: 'VALID_ERROR',
          message: 'Valid error',
        },
      }

      expect(() => registerErrors(errors)).not.toThrow()
      expect(getError('VALID_ERROR')).toEqual({
        code: 'VALID_ERROR',
        message: 'Valid error',
      })
    })

    it('should reject invalid error code formats', () => {
      expect(() => {
        registerErrors({
          'invalid-code': {
            code: 'invalid-code',
            message: 'Invalid',
          },
        })
      }).toThrow(/Invalid error code format/)

      expect(() => {
        registerErrors({
          lowercase_error: {
            code: 'lowercase_error',
            message: 'Invalid',
          },
        })
      }).toThrow(/Invalid error code format/)

      expect(() => {
        registerErrors({
          ERROR_: {
            code: 'ERROR_',
            message: 'Invalid',
          },
        })
      }).toThrow(/Invalid error code format/)
    })

    it('should reject mismatched code keys', () => {
      expect(() => {
        registerErrors({
          CODE_A: {
            code: 'CODE_B',
            message: 'Mismatch',
          },
        })
      }).toThrow(/Error code mismatch/)
    })

    it('should reject duplicate codes', () => {
      registerErrors({
        DUPLICATE_TEST: {
          code: 'DUPLICATE_TEST',
          message: 'First',
        },
      })

      expect(() => {
        registerErrors({
          DUPLICATE_TEST: {
            code: 'DUPLICATE_TEST',
            message: 'Second',
          },
        })
      }).toThrow(/Duplicate error code/)
    })
  })

  describe('getError', () => {
    it('should return registered error', () => {
      registerErrors({
        TEST_ERROR: {
          code: 'TEST_ERROR',
          message: 'Test error',
        },
      })

      expect(getError('TEST_ERROR')).toEqual({
        code: 'TEST_ERROR',
        message: 'Test error',
      })
    })

    it('should return undefined for unregistered error', () => {
      expect(getError('UNREGISTERED_ERROR')).toBeUndefined()
    })

    it('should return core errors', () => {
      expect(getError('SERVER_ERROR')).toBeDefined()
      expect(getError('BAD_REQUEST')).toBeDefined()
      expect(getError('NETWORK_ERROR')).toBeDefined()
      expect(getError('UNEXPECTED_ERROR')).toBeDefined()
    })
  })
})
