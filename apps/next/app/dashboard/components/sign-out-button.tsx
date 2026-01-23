'use client'

import Link from 'next/link'
import { clearAuthToken } from '@/lib/auth-token'

export function SignOutButton() {
  const handleSignOut = () => {
    clearAuthToken() // Clear JWT token
    // Link will navigate to /api/auth/sign-out which clears session cookie
  }

  return (
    <Link
      href="/api/auth/sign-out"
      onClick={handleSignOut}
      className="rounded-md bg-destructive px-4 py-2 text-destructive-foreground hover:bg-destructive/90 text-sm font-medium transition-colors"
    >
      Sign Out
    </Link>
  )
}
