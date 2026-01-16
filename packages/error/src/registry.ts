import { clientErrors, commonErrors, serverErrors } from './catalogs/index.js'
import type { CatalogError } from './types.js'

const registry = new Map<string, CatalogError>()

/**
 * Validates error code format (UPPER_SNAKE_CASE)
 * Pattern: Must start with uppercase letter, contain only uppercase letters, numbers, and underscores,
 * and end with uppercase letter or number
 */
const ERROR_CODE_PATTERN = /^[A-Z][A-Z0-9_]*[A-Z0-9]$/

/**
 * Validates error code format
 * @throws Error if code format is invalid
 */
function validateErrorCode(code: string): void {
  if (!ERROR_CODE_PATTERN.test(code)) {
    throw new Error(
      `Invalid error code format: "${code}". ` +
        `Must be UPPER_SNAKE_CASE (e.g., NETWORK_ERROR, USER_NOT_FOUND)`,
    )
  }
}

/**
 * Registers error codes in the catalog registry
 * Validates format, checks for duplicates, and ensures code key matches error.code property
 * @throws Error if validation fails or duplicate code found
 */
export function registerErrors(errors: Record<string, CatalogError>): void {
  for (const [code, error] of Object.entries(errors)) {
    // Validate code format
    validateErrorCode(code)

    // Validate code matches error.code property
    if (code !== error.code) {
      throw new Error(
        `Error code mismatch: key "${code}" does not match error.code "${error.code}"`,
      )
    }

    // Check for duplicates
    if (registry.has(code)) {
      throw new Error(`Duplicate error code: ${code}`)
    }

    registry.set(code, error)
  }
}

/**
 * Retrieves an error from the registry by code
 * @returns CatalogError if found, undefined otherwise
 */
export function getError(code: string): CatalogError | undefined {
  return registry.get(code)
}

/**
 * Clears the registry (for testing purposes only)
 * Note: Core catalogs will be re-registered on next import
 */
export function clearRegistry(): void {
  registry.clear()
  // Re-register core catalogs
  registerErrors({ ...serverErrors, ...clientErrors, ...commonErrors })
}

// Auto-register core catalogs on module import
registerErrors({ ...serverErrors, ...clientErrors, ...commonErrors })
