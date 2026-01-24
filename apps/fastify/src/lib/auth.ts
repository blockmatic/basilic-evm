import type { EmailProvider } from './email.js'

declare global {
  var __betterAuthTestEmailProvider: EmailProvider | null | undefined
}

/**
 * Set the email provider for tests.
 * Used by the email plugin to provide a test email provider instead of Resend.
 */
export function setTestEmailProvider(provider: EmailProvider | null) {
  if (typeof globalThis !== 'undefined') {
    globalThis.__betterAuthTestEmailProvider = provider
  }
}
