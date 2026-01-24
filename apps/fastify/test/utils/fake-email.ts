import type { EmailProvider } from '../../src/lib/email.js'

type Email = {
  to: string
  subject: string
  html: string
  text?: string
  from?: string
}

export class FakeEmailProvider implements EmailProvider {
  private outbox: Email[] = []

  emails = {
    send: async (options: {
      from: string
      to: string
      subject: string
      html: string
      text?: string
    }): Promise<{ data: { id: string }; error: null }> => {
      this.outbox.push({
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
        from: options.from,
      })
      return {
        data: { id: `fake-email-${this.outbox.length}` },
        error: null,
      }
    },
  }

  last(): Email | undefined {
    return this.outbox[this.outbox.length - 1]
  }

  all(): Email[] {
    return [...this.outbox]
  }

  clear(): void {
    this.outbox = []
  }

  extractMagicLink(email?: Email): string | null {
    const targetEmail = email ?? this.last()
    if (!targetEmail) return null

    // Try to extract from HTML first
    const htmlMatch = targetEmail.html.match(/href=["']([^"']*magic-link[^"']*)["']/i)
    const htmlLink = htmlMatch?.[1]
    if (htmlLink) {
      return htmlLink
    }

    // Try to extract from text if available
    if (targetEmail.text) {
      const textMatch = targetEmail.text.match(/(https?:\/\/[^\s]*magic-link[^\s]*)/i)
      const textLink = textMatch?.[1]
      if (textLink) {
        return textLink
      }
    }

    // Fallback: look for any URL with token parameter
    const urlMatch = targetEmail.html.match(/href=["']([^"']*\?token=[^"']*)["']/i)
    const urlLink = urlMatch?.[1]
    if (urlLink) {
      return urlLink
    }

    return null
  }

  extractToken(email?: Email): string | null {
    const magicLink = this.extractMagicLink(email)
    if (!magicLink) return null

    try {
      const url = new URL(magicLink)
      return url.searchParams.get('token')
    } catch {
      // If URL parsing fails, try regex extraction
      const tokenMatch = magicLink.match(/[?&]token=([^&]+)/)
      return tokenMatch ? tokenMatch[1] : null
    }
  }
}
