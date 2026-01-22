import { createQueryKeys } from '@lukemorales/query-key-factory'

export const auth = createQueryKeys('auth', {
  sendMagicLink: (email: string) => ({
    queryKey: [email],
    queryFn: async (): Promise<{ success: boolean }> => {
      const callbackURL = `${window.location.origin}/dashboard`
      const response = await fetch('/api/auth/sign-in/magic-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, callbackURL }),
      })

      if (!response.ok) {
        let errorMessage = 'Failed to send magic link'
        let errorCode: string | undefined
        try {
          const errorData = await response.json()
          // Extract error code and message
          errorCode = errorData.code
          errorMessage =
            errorData.message ||
            errorData.error?.message ||
            errorData.error ||
            errorData.code ||
            'Failed to send magic link'
        } catch {
          // If response is not JSON, try to get text
          const text = await response.text().catch(() => '')
          errorMessage = text || errorMessage
        }
        // Create error with code property for validation detection
        const error = new Error(errorMessage) as Error & { code?: string }
        error.code = errorCode
        throw error
      }

      const data = await response.json()
      // Better Auth returns {status: true} but we need {success: boolean}
      return { success: data.status === true || data.success === true }
    },
  }),
})
