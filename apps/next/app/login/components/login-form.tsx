'use client'

import { type CatalogError, captureError } from '@repo/error/nextjs'
import { Button } from '@repo/ui/components/button'
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from '@repo/ui/components/field'
import { Input } from '@repo/ui/components/input'
import { cn } from '@repo/ui/lib/utils'
import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'

export function LoginForm({ className, ...props }: React.ComponentProps<'form'>) {
  const [email, setEmail] = useState('')
  const [catalogError, setCatalogError] = useState<CatalogError | null>(null)

  const mutation = useMutation({
    mutationFn: async (email: string): Promise<{ success: boolean }> => {
      const response = await fetch('/api/auth/sign-in/magic-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          message: 'Failed to send magic link',
        }))
        throw new Error(errorData.message || 'Failed to send magic link')
      }

      return response.json()
    },
    onError: error => {
      const catalogErr = captureError({
        code: 'MAGIC_LINK_SEND_FAILED',
        error,
        label: 'Login Form',
        tags: { app: 'web', feature: 'auth' },
      })
      setCatalogError(catalogErr)
    },
    onSuccess: () => {
      setEmail('')
      setCatalogError(null)
    },
  })

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setCatalogError(null)
    mutation.mutate(email)
  }

  return (
    <form className={cn('flex flex-col gap-6', className)} onSubmit={handleSubmit} {...props}>
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">Login to your account</h1>
          <p className="text-muted-foreground text-sm text-balance">
            Enter your email below to login to your account
          </p>
        </div>
        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            type="email"
            placeholder="m@example.com"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            disabled={mutation.isPending || mutation.isSuccess}
          />
        </Field>
        {catalogError && (
          <FieldDescription className="text-destructive text-center">
            {catalogError.message}
          </FieldDescription>
        )}
        {mutation.isSuccess && (
          <FieldDescription className="text-center text-green-600 dark:text-green-400">
            Check your email for the magic link
          </FieldDescription>
        )}
        <Field>
          <Button type="submit" disabled={mutation.isPending || mutation.isSuccess}>
            {mutation.isPending ? 'Sending...' : 'Send magic link'}
          </Button>
        </Field>
        <FieldSeparator>Or continue with</FieldSeparator>
        <Field>
          <Button
            variant="outline"
            type="button"
            disabled={mutation.isPending || mutation.isSuccess}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="size-4">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Login with Google
          </Button>
        </Field>
      </FieldGroup>
    </form>
  )
}
