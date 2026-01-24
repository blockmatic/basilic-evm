/**
 * Error interface with a message property.
 *
 * Follows the Kent C. Dodds pattern for type-safe error message extraction.
 * Used to represent any error-like object that has a message property,
 * enabling safe error handling without type assertions.
 *
 * @example
 * ```ts
 * function handleError(error: unknown) {
 *   if (isErrorWithMessage(error)) {
 *     console.error(error.message) // Type-safe access
 *   }
 * }
 * ```
 */
export interface ErrorWithMessage {
  /** Error message string */
  message: string
}
