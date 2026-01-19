import type { CatalogError } from '../types.js'

/**
 * Web app-specific error codes
 * These errors are specific to the web application
 */
export const webErrors = {
  DASHBOARD_DATA_LOAD_FAILED: {
    code: 'DASHBOARD_DATA_LOAD_FAILED',
    message: 'Failed to load dashboard data',
  },
  SAVE_GAME_FAILED: {
    code: 'SAVE_GAME_FAILED',
    message: 'Failed to save game history',
  },
} as const satisfies Record<string, CatalogError>
