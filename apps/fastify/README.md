# API

Type-safe REST API built with Fastify & OpenAPI.

The API provides a RESTful interface with end-to-end type safety from OpenAPI specifications to generated clients. Built on Fastify for high performance. Fastify routes are the source of truth and the OpenAPI spec is generated from route definitions via `generate-openapi.ts`.

## Requirements

- **Node.js**: `>=22`
- **pnpm**: `10.28.0`

## Development

**Important**: You must start your database before running the dev server:

```bash
# For local development with Supabase (run this first)
pnpm db:start

# In another terminal, start the dev server
pnpm dev
```

**Note**: The `db:start` script uses Supabase CLI for local development. For other PostgreSQL databases, ensure your database is running and `DATABASE_URL` is configured. Alternatively, use `PGLITE=true` for in-memory database (no setup required).

The dev server will start with hot reload at [http://localhost:3000](http://localhost:3000).

If the database is not available, the server will error with a clear message. Make sure your database is running and accessible before starting the dev server.

## Scripts

- `pnpm dev` - Development server with hot reload (requires database to be running - see Development section)
- `pnpm build` - Run database migrations and build TypeScript
- `pnpm start` - Production server (requires build)
- `pnpm test` - Run tests
- `pnpm checktypes` - Type-check without emitting output
- `pnpm db:start` - Start local database instance (Supabase CLI - must be run before `pnpm dev` for local development)
- `pnpm db:stop` - Stop local database instance (Supabase CLI)
- `pnpm db:status` - Check local database status (Supabase CLI)
- `pnpm db:migrate` - Run database migrations (PostgreSQL only; PGLite migrations run at runtime)
- `pnpm db:generate` - Generate migrations from schema changes
- `pnpm db:push` - Push schema changes directly (dev only, no migrations)
- `pnpm generate:openapi` - Generate OpenAPI specification from Fastify routes (uses dummy `OPENAI_API_KEY` if missing)

All runtime scripts build `@repo/utils` first to ensure compiled workspace dependencies are available.

## Testing

Tests run with Vitest in ESM mode against the TypeScript source.

### Test Database

Tests use a **single shared PGLite in-memory database** for all test files:

- **Single shared instance**: One PGLite instance is created before all test files execute and shared across all tests
- **State sharing across files**: Tests can share state/data across different test files (e.g., create an account in one test file, then test login in another)
- **Automatic cleanup**: Database instance is automatically deleted after all tests complete
- **Failure handling**: If tests fail, the database instance is still cleaned up in global teardown

**Lifecycle:**
1. **Global Setup** (`vitest.global-setup.ts`): Creates a single PGLite instance and runs migrations directly using SQL execution
2. **Tests run**: All test files share the same database instance via singleton pattern
3. **Global Teardown** (`vitest.global-setup.ts`): Deletes the database instance after all tests complete

**Important**: Tests share the same database instance. If you need isolated state, clean up data in your tests or use transactions.

## Environment Variables

The API uses environment variables for configuration. See [Environment Setup Guide](@apps/docu/content/docs/getting-started/installation.mdx) for complete details.
The server loads `apps/fastify/.env` using Node.js native `--env-file` flag (Node.js 20.6+).

### Required
- `NODE_ENV` - Environment mode (`development`, `test`, `production`)

### Optional
- `PORT` - Server port (default: `3000`)
- `HOST` - Server host (default: `0.0.0.0`)
- `PGLITE` - Use in-memory PGLite database instead of PostgreSQL (default: `false`)
  - Set to `true` for preview branches, local dev without PostgreSQL, or ephemeral environments
  - When `PGLITE=true`, `DATABASE_URL` is optional and defaults to PGLite URL
  - When `PGLITE=false`, `DATABASE_URL` is required
- `DATABASE_URL` - PostgreSQL connection string (required when `PGLITE=false`)
- `REDIS_URL` - Redis connection string
- `OPENAI_API_KEY` - OpenAI API key (required in production; dev uses a dummy default)
- `SENTRY_DSN` - Sentry DSN for error tracking
- `SENTRY_ENVIRONMENT` - Sentry environment name
- `SENTRY_TRACES_SAMPLE_RATE` - Sentry traces sample rate (default: `1`)
- `SENTRY_REPLACES_HEADERS` - Replace headers with Sentry (default: `false`)
- `SENTRY_REPLACES_PROD_ENV` - Replace production env with Sentry (default: `false`)
- `REQUEST_TIMEOUT` - Request timeout in milliseconds (default: `30000`)

## Deployment

The API can be deployed to multiple platforms with zero code changes:

- **Vercel** (Development) - Serverless functions via `vercel.json`
- **Google Cloud Run** (Production) - Containerized deployment
- **AWS ECS/EC2** (Production) - Container or VM deployment

See [Deployment Guide](https://basilic-docs.vercel.app/docs/guides/deployment) for detailed deployment instructions and [Portability Strategy](https://basilic-docs.vercel.app/docs/portability) for migration paths.

### Vercel Deployment

When deploying to Vercel, the serverless function is located at `api/[...].ts` (configured in `vercel.json`). All requests are rewritten to `/fastify` to route to this function. This configuration ensures the Fastify application runs correctly in Vercel's serverless environment.

## API Documentation

- **Scalar UI**: `/reference`
- **OpenAPI Spec**: `/reference/openapi.json`
- **Health Check**: `GET /health`

## Architecture

REST API architecture using OpenAPI:

- **Routes**: Implemented in `src/routes/` (Fastify plugins) - the source of truth
- **OpenAPI Spec**: Generated in `openapi/openapi.json` from Fastify routes via `generate-openapi.ts`
- **Clients**: Generated by Hey API in `@repo/core` and `@repo/react` from the OpenAPI spec
- **Type Safety**: End-to-end from routes → OpenAPI spec → generated clients
- **Schemas**: Zod schemas are converted to JSON Schema via `zod-to-json-schema` for Fastify validation/OpenAPI
- **Framework**: Fastify for high-performance HTTP server
- **Validation**: Zod schemas for runtime validation

Fastify routes are the source of truth. The OpenAPI specification is automatically generated from route definitions, ensuring consistency between implementation and documentation. This enables type-safe client generation across the entire stack from API to client.

## Database Migrations

The API supports two migration strategies depending on database type:

- **PostgreSQL** (`PGLITE=false`): Migrations run at build time via `pnpm build` → `pnpm db:migrate` → `tsc`
  - Faster startup (migrations already applied)
  - Fails fast if migrations have issues
  - Works with any deployment platform (Vercel, Docker, Railway, etc.)

- **PGLite** (`PGLITE=true`): Migrations skip at build time, run at runtime when instance is created
  - PGLite instance doesn't exist at build time
  - Migrations run during app initialization (`src/server.ts` or `api/[...].ts`)
  - **Direct SQL execution**: Migrations are executed directly using PGLite's `exec()` method rather than Drizzle's `migratePGLite()` function
    - `migratePGLite()` silently fails to apply migrations in some contexts
    - Direct SQL execution ensures migrations are reliably applied
    - Migration SQL files are read and executed in order, handling multiple statements per file

**Test Environment**:
- Uses a single shared PGLite instance created in `vitest.global-setup.ts`
- Migrations run once before all test files execute using direct SQL execution
- All test files share the same database instance and schema

See [Backend Stack](/docs/architecture/backend-stack), [API Development](/docs/core-concepts/api-architecture), and [ADR 008: Database](/docs/adrs/008-database) for detailed migration flow and architecture.
