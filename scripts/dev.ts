/**
 * Local-development entry point. Loads environment configuration and exits with
 * the paired-service supervisor result.
 */

import { runDevelopment } from './dev-runtime.ts'

try {
  process.exitCode = await runDevelopment()
} catch (error) {
  console.error(
    'Unable to start MediVault development:',
    error instanceof Error ? error.message : error,
  )
  process.exitCode = 1
}
