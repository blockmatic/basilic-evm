// Export types

// Export utilities (re-exported from @repo/utils/error)
export {
  getErrorMessage,
  isErrorWithMessage,
  toErrorWithMessage,
} from '@repo/utils/error'
// Export mappers
export { mapHttpStatusToErrorCode } from '../mappers.js'

// Export registry functions
export { getError } from '../registry.js'
export type { CaptureErrorOptions, CatalogError, ErrorWithMessage } from '../types.js'
