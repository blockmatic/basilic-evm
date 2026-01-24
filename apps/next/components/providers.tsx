'use client'

import { createClient } from '@repo/core'
import { ReactApiProvider } from '@repo/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider as NextThemesProvider } from 'next-themes'
import { NuqsAdapter } from 'nuqs/adapters/next/app'
import type { ReactNode } from 'react'
import { env } from '@/lib/env'

// Create clients at module level (singleton pattern)
const queryClient = new QueryClient()

const coreClient = createClient({
  baseUrl: env.NEXT_PUBLIC_API_URL,
})

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ReactApiProvider client={coreClient}>
        <NuqsAdapter>
          <NextThemesProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
            enableColorScheme
          >
            {children}
          </NextThemesProvider>
        </NuqsAdapter>
      </ReactApiProvider>
    </QueryClientProvider>
  )
}
