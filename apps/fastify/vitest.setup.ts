/**
 * Vitest Test Setup
 *
 * Runs before each test file in each worker.
 * Provides global setup for React Email components.
 *
 * ## Database Lifecycle
 *
 * Database lifecycle is now managed by each group entry `.spec.ts` file.
 * See `test/utils/db-setup.ts` for the DB setup utility.
 *
 * ## Important Notes
 *
 * - React global setup is kept here for React Email components
 * - DB lifecycle moved to group entry files per testing strategy rules
 * - Each group entry file owns its Fastify + DB lifecycle
 */

import React from 'react'

// Make React available globally for React Email components
// React Email components use JSX which requires React to be available at runtime
// Even with the new JSX transform (react-jsx), React needs to be accessible when components execute
if (typeof globalThis !== 'undefined') {
  globalThis.React = React
}
