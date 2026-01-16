// Import registry first to auto-register core catalogs
import './registry.js'

// Export public APIs
export { captureError } from './capture.js'
export { mapHttpStatusToErrorCode } from './mappers.js'
export { getError, registerErrors } from './registry.js'
export type { InitSentryOptions } from './sentry.js'
export { initSentry } from './sentry.js'
export type {
  CaptureErrorOptions,
  CatalogError,
  ErrorWithMessage,
} from './types.js'
export {
  getErrorMessage,
  isErrorWithMessage,
  toErrorWithMessage,
} from './utils.js'
