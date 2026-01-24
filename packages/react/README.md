# @repo/react

Provides React Query hooks for `@repo/core` API functions.

## Exports

- `ReactApiProvider` - Provider component that makes API client available to hooks
- `useReactApiConfig` - Hook to access API client and query defaults from context
- `useHealthCheck` - React Query hook for health check endpoint
- `createReactApiConfig` - Utility function to normalize API configuration
- Generated hooks - All API endpoints have corresponding React Query hooks (from `gen/index`)

## Usage

### Setup

Wrap your app with `QueryClientProvider` and `ReactApiProvider`:

```tsx
import { ReactApiProvider } from '@repo/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createClient } from '@repo/core'

const queryClient = new QueryClient()

// Create core client instance with authentication
const coreClient = createClient({
  baseUrl: 'https://api.example.com',
  getAuthToken: async () => {
    // Get access token from storage
    return localStorage.getItem('accessToken')
  },
  getRefreshToken: async () => {
    // Get refresh token from storage
    return localStorage.getItem('refreshToken')
  },
  onTokensRefreshed: async ({ token, refreshToken }) => {
    // Update tokens in storage
    localStorage.setItem('accessToken', token)
    localStorage.setItem('refreshToken', refreshToken)
  },
  getHeaders: async () => ({ 'X-Custom': 'value' }),
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ReactApiProvider
        client={coreClient}
        queryClientDefaults={{
          retry: 3,
          staleTime: 5 * 60 * 1000, // 5 minutes
        }}
      >
        <MyComponent />
      </ReactApiProvider>
    </QueryClientProvider>
  )
}
```

### Using Hooks

#### Built-in Hooks

```tsx
import { useHealthCheck } from '@repo/react'

function MyComponent() {
  // Hook uses core client instance directly
  const { data, isLoading, error } = useHealthCheck()
  // data is fully typed from OpenAPI spec
  
  // Hooks support params that the core client function supports
  const { data: healthData } = useHealthCheck({ query: { include: 'details' } })
  
  // Override query options per hook
  const { data: refetchData } = useHealthCheck(
    undefined,
    { refetchInterval: 30000 }
  )
  
  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>
  
  return <div>Server status: {data?.datetime}</div>
}
```

#### Generated Hooks

All API endpoints have corresponding React Query hooks:

```tsx
import { useAuthMagiclinkRequest, useAuthSessionLogout } from '@repo/react'

function LoginForm() {
  const { mutate: requestMagicLink, isPending } = useAuthMagiclinkRequest()
  
  const handleSubmit = (email: string) => {
    requestMagicLink(
      { body: { email, callbackUrl: window.location.origin } },
      {
        onSuccess: () => {
          console.log('Magic link sent!')
        },
        onError: (error) => {
          console.error('Failed to send magic link:', error)
        },
      }
    )
  }
  
  return (
    <form onSubmit={(e) => {
      e.preventDefault()
      handleSubmit(e.currentTarget.email.value)
    }}>
      <input name="email" type="email" />
      <button type="submit" disabled={isPending}>
        {isPending ? 'Sending...' : 'Send Magic Link'}
      </button>
    </form>
  )
}
```

### Accessing API Client

Use `useReactApiConfig` to access the API client directly:

```tsx
import { useReactApiConfig } from '@repo/react'

function CustomHook() {
  const { client, queryClientDefaults } = useReactApiConfig()
  
  // Use client directly for custom logic
  const customOperation = async () => {
    const result = await client.auth.magiclink.request({ body: { email } })
    return result
  }
  
  return { customOperation }
}
```

### Query Client Defaults

Configure default query options that apply to all hooks:

```tsx
<ReactApiProvider
  client={coreClient}
  queryClientDefaults={{
    retry: 3, // Retry failed requests 3 times
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
  }}
>
  <App />
</ReactApiProvider>
```

Individual hooks can override these defaults:

```tsx
// This hook won't retry (overrides default retry: 3)
const { data } = useHealthCheck(undefined, { retry: false })
```

## Error Handling

Hooks throw errors that you can handle:

```tsx
import { useHealthCheck } from '@repo/react'
import { ApiError } from '@repo/core'

function HealthStatus() {
  const { data, error } = useHealthCheck()
  
  if (error) {
    if (error instanceof ApiError) {
      return <div>API Error {error.status}: {error.message}</div>
    }
    return <div>Error: {error.message}</div>
  }
  
  return <div>Status: {data?.datetime}</div>
}
```

## Dependency Strategy

This package follows the **Framework Wrapper Library** pattern:

- **Peer Dependencies**: Framework dependencies (`react`, `@tanstack/react-query`) - consumers control versions
- **Bundled Dependencies**: Internal workspace dependencies (`@repo/core`)
- **Rationale**: Consumers control framework versions, library adapts to their React Query setup

See [API Development](https://basilic-docs.vercel.app/docs/core-concepts/api-architecture#client-consumption) for full integration guide.
