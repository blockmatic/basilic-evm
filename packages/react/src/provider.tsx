import type { ReactNode } from 'react'
import { ReactApiContext } from './context.js'
import type { ReactApiConfig } from './setup.js'
import { createReactApiConfig } from './setup.js'

export function ReactApiProvider({
  children,
  ...config
}: ReactApiConfig & { children: ReactNode }): React.JSX.Element {
  const apiConfig = createReactApiConfig(config)

  return <ReactApiContext.Provider value={apiConfig}>{children}</ReactApiContext.Provider>
}
