import { createContext, useContext } from 'react'
import type { ReactApiConfigValue } from './setup.js'

const ReactApiContext = createContext<ReactApiConfigValue | null>(null)

export function useReactApiConfig(): ReactApiConfigValue {
  const context = useContext(ReactApiContext)
  if (!context) {
    throw new Error('useReactApiConfig must be used within ReactApiProvider')
  }
  return context
}

export { ReactApiContext }
