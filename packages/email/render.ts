import { render as reactEmailRender } from '@react-email/render'
import React, { type ReactNode } from 'react'

const ensureReactGlobal = () => {
  if (typeof globalThis === 'undefined') {
    return
  }

  const globalScope = globalThis as typeof globalThis & { React?: typeof React }
  if (!globalScope.React) {
    globalScope.React = React
  }
}

/**
 * Render an email template component to HTML string.
 * Uses @react-email/render which supports async rendering and Suspense.
 */
export const render = async (component: ReactNode): Promise<string> => {
  ensureReactGlobal()
  return reactEmailRender(component)
}
