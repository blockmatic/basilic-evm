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

// Ensure React is available globally at module load time
// This provides a defensive measure in case components are evaluated before render() is called
ensureReactGlobal()

/**
 * Render an email template component to HTML string.
 * Uses @react-email/render which supports async rendering and Suspense.
 */
export const render = async (component: ReactNode): Promise<string> => {
  // Ensure React is set globally before rendering (defensive check)
  ensureReactGlobal()
  return reactEmailRender(component)
}
