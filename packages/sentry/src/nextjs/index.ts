// Re-export core functionality (types, registry, utils)

// Explicitly export CatalogError for convenience
export type { CatalogError } from '../core/index.js'
export * from '../core/index.js'

// Export Next.js-specific Sentry functions
export { captureError } from './capture.js'
export type { InitSentryOptions } from './sentry.js'
export { initSentry } from './sentry.js'
