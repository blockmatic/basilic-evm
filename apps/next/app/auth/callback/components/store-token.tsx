'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { storeAuthToken } from '@/lib/auth-token'

type StoreTokenClientProps = {
  token: string
}

export function StoreTokenClient({ token }: StoreTokenClientProps) {
  const router = useRouter()

  useEffect(() => {
    storeAuthToken(token)
    router.push('/dashboard?authenticated=true')
  }, [token, router])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center space-y-4">
        <div className="mx-auto size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-muted-foreground">Storing token and redirecting...</p>
      </div>
    </div>
  )
}
