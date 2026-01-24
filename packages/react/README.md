# @repo/react

Provides React Query hooks for repo/core functions.

## Usage

```tsx
import { ReactApiProvider } from '@repo/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createClient } from '@repo/core'
import { useState } from 'react'

// Create a client
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
      <ReactApiProvider client={coreClient}>
        <MyComponent />
      </ReactApiProvider>
    </QueryClientProvider>
  )
}
```

```tsx
import { useHealthCheck } from '@repo/react'

function MyComponent() {
  // Hook uses core client instance directly
  const { data } = useHealthCheck()
  // data is fully typed from OpenAPI spec
  
  // Hooks support params that the core client function supports
  const { data: healthData } = useHealthCheck({ query: { ... } })
}
```

## Dependency Strategy

This package follows the **Framework Wrapper Library** pattern:

- **Peer Dependencies**: Framework dependencies (`react`, `@tanstack/react-query`) - consumers control versions
- **Bundled Dependencies**: Internal workspace dependencies (`@repo/core`)
- **Rationale**: Consumers control framework versions, library adapts to their React Query setup

See [API Development](https://basilic-docs.vercel.app/docs/core-concepts/api-architecture#client-consumption) for full integration guide.
