# @repo/error

Error handling utilities with Sentry integration and error catalog registry. Provides consistent, type-safe error handling across all monorepo applications.

## Features

- ✅ **Registry Pattern**: Decentralized error catalogs registered at runtime
- ✅ **Sentry Integration**: Async error capture with built-in PII scrubbing
- ✅ **Type-Safe**: TypeScript-first with proper type guards
- ✅ **Framework-Native**: Fastify handlers, React Error Boundaries, Next.js error pages
- ✅ **Security-First**: Sentry built-in PII scrubbing, no internal leaks
- ✅ **Performance**: Async Sentry capture, non-blocking, zero latency impact

## Quick Start

### Capture Error (Most Common)

```typescript
import { captureError } from '@repo/error'

const catalogError = captureError({
  code: 'NETWORK_ERROR',
  error, // Real error → Sentry (full stack trace)
  label: 'API Call',
  data: { endpoint: '/api/data' }, // Internal context → Sentry
  tags: { app: 'web' },
})
// Returns: { code: 'NETWORK_ERROR', message: 'A network error occurred' }
// User sees safe message, Sentry gets full details
```

### Extract Error Message

```typescript
import { getErrorMessage } from '@repo/error'
const message = getErrorMessage(error) // Type-safe!
```

### Register App-Specific Errors

```typescript
import { registerErrors } from '@repo/error'

const appErrors = {
  DASHBOARD_DATA_LOAD_FAILED: {
    code: 'DASHBOARD_DATA_LOAD_FAILED',
    message: 'Failed to load dashboard data',
  },
} as const

// Register BEFORE any error handling code runs (in app entry point)
registerErrors(appErrors)
```

### Initialize Sentry

```typescript
import { initSentry } from '@repo/error'

// Initialize BEFORE framework starts
initSentry({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
})
```

## Core Concepts

### Two-Track Error Handling

When an error occurs, two separate things happen:

1. **Sentry (Internal)** - REAL error with full stack trace and internal context for debugging
2. **API Response (External)** - SAFE catalog error with user-friendly message

```typescript
// Real error occurs
const realError = new Error('Connection to postgres://internal-db:5432 failed')

// captureError sends REAL error to Sentry
const catalogError = captureError({
  code: 'SERVER_ERROR',
  error: realError, // ← Full error with stack trace → Sentry
  label: 'Database Connection',
  data: { host: 'internal-db' }, // Internal details for debugging
})

// API returns SAFE catalog error to user
reply.status(500).send(catalogError)
// Response: { code: 'SERVER_ERROR', message: 'An internal server error occurred' }
// ❌ User NEVER sees: stack traces, connection strings, internal IPs
```

### Registry Pattern

Apps define and register their own error catalogs locally, then register them with `@repo/error`:

```typescript
// apps/api/src/lib/error-catalog.ts
export const apiErrors = {
  AI_MODEL_ERROR: {
    code: 'AI_MODEL_ERROR',
    message: 'AI model error occurred',
  },
} as const

// apps/api/src/index.ts
import { registerErrors, initSentry } from '@repo/error'
import { apiErrors } from './lib/error-catalog'

// 1. Register app errors FIRST (before any routes load)
registerErrors(apiErrors)

// 2. Initialize Sentry
initSentry({ dsn: process.env.SENTRY_DSN })

// 3. Start framework
const app = fastify()
```

**Critical**: App errors MUST be registered during app startup BEFORE any error handling code runs.

## API Reference

### `captureError(options)`

Captures an error to Sentry and returns a safe catalog error for API responses.

```typescript
interface CaptureErrorOptions {
  code: string // Error code (must be registered)
  error: unknown // Real error: sent to Sentry
  label: string // Component/feature label
  data?: Record<string, unknown> // Additional context (Sentry only)
  tags?: {
    app: string // Required: 'api' | 'web' | 'mobile'
    package?: string // Optional: '@repo/auth'
    module?: string // Optional: 'user-service'
  }
  level?: 'error' | 'warning' | 'info'
}

function captureError(options: CaptureErrorOptions): CatalogError
```

### `registerErrors(errors)`

Registers error codes in the catalog registry.

```typescript
function registerErrors(errors: Record<string, CatalogError>): void
```

### `getError(code)`

Retrieves an error from the registry by code.

```typescript
function getError(code: string): CatalogError | undefined
```

### `initSentry(options)`

Initializes Sentry for error tracking. Supports both `@sentry/node` and `@sentry/nextjs`.

```typescript
interface InitSentryOptions {
  dsn?: string
  environment?: string
  release?: string
  beforeSend?: (event: Sentry.Event) => Sentry.Event | null
}

function initSentry(options: InitSentryOptions): void
```

### `mapHttpStatusToErrorCode(statusCode)`

Maps HTTP status codes to error catalog codes.

```typescript
function mapHttpStatusToErrorCode(statusCode?: number): string
```

### `getErrorMessage(error)`

Extracts error message from unknown error type (type-safe).

```typescript
function getErrorMessage(error: unknown): string
```

## Framework Integration

### Fastify

```typescript
// apps/api/src/plugins/error-handler.ts
import { captureError, mapHttpStatusToErrorCode } from '@repo/error'

fastify.setErrorHandler((error, request, reply) => {
  const catalogError = captureError({
    code: mapHttpStatusToErrorCode(error.statusCode),
    error,
    label: `${request.method} ${request.url}`,
    tags: { app: 'api', module: 'user-service' },
  })
  reply.status(error.statusCode ?? 500).send(catalogError)
})
```

### React Error Boundary

```typescript
import { AppErrorBoundary } from '@repo/error'

<AppErrorBoundary app="web">
  <App />
</AppErrorBoundary>
```

### Next.js

```typescript
// apps/web/instrumentation.ts
import { registerErrors, initSentry } from '@repo/error'
import { webErrors } from './lib/error-catalog'

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    registerErrors(webErrors)
    initSentry({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      environment: process.env.NODE_ENV,
    })
  }
}
```

## Error Code Format

Error codes must be `UPPER_SNAKE_CASE`:

- ✅ `NETWORK_ERROR`
- ✅ `USER_NOT_FOUND`
- ✅ `AI_MODEL_ERROR`
- ❌ `network-error` (invalid)
- ❌ `NetworkError` (invalid)
- ❌ `NETWORK_ERROR_` (invalid)

## Core Error Catalogs

The package includes core error catalogs that are auto-registered:

**Server Errors**: `SERVER_ERROR`, `BAD_REQUEST`, `NOT_FOUND`, `UNAUTHORIZED`, `FORBIDDEN`, `INVALID_INPUT`, `CONFLICT`, `RATE_LIMIT_EXCEEDED`, `BAD_GATEWAY`, `SERVICE_UNAVAILABLE`, `GATEWAY_TIMEOUT`

**Client Errors**: `CLIENT_VALIDATION_ERROR`, `CLIENT_FORMAT_ERROR`, `NETWORK_ERROR`, `NETWORK_TIMEOUT`, `FETCH_ERROR`

**Common**: `UNEXPECTED_ERROR`

## Security

- Sentry's built-in PII scrubbing handles sensitive data automatically
- Optional `beforeSend` hook for domain-specific scrubbing
- Never expose internal details to users
- All errors logged via `@repo/utils/logger` (Pino on server, console wrapper on client)

## Performance

- Async Sentry capture via `setImmediate()` (non-blocking)
- Error extraction: < 1ms
- Zero latency impact on API responses

## Testing

Mock Sentry and logger in tests:

```typescript
vi.mock('@sentry/node', () => ({
  getClient: vi.fn(() => ({})),
  captureException: vi.fn(),
}))

vi.mock('@repo/utils/logger', () => ({
  logger: {
    child: vi.fn(() => ({ error: vi.fn() })),
  },
}))
```

## Migration from @repo/utils/error

Error utilities have been moved from `@repo/utils/error` to `@repo/error`:

```typescript
// Old
import { getErrorMessage } from '@repo/utils/error'

// New
import { getErrorMessage, captureError } from '@repo/error'
```

## See Also

- [Error Handling Guide](https://basilic-docs.vercel.app/docs/guides/error-handling) - Complete guide with examples and best practices
- [Logging Guide](https://basilic-docs.vercel.app/docs/guides/logging) - Logging patterns with @repo/utils/logger
- [Security Guide](https://basilic-docs.vercel.app/docs/guides/security) - Security best practices and PII handling

## License

PROPRIETARY
