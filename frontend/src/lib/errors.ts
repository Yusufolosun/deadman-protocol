/**
 * Extract a user-friendly error message from various error types.
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message: unknown }).message)
  }
  return 'An unexpected error occurred'
}

/**
 * Determine if an error represents a user cancellation
 * (e.g. wallet popup closed).
 */
export function isUserCancellation(error: unknown): boolean {
  const message = getErrorMessage(error).toLowerCase()
  return (
    message.includes('cancel') ||
    message.includes('rejected') ||
    message.includes('user denied') ||
    message.includes('popup closed')
  )
}

/**
 * Map Clarity contract error codes to human-readable messages.
 */
const CLARITY_ERROR_CODES: Record<number, string> = {
  100: 'Unauthorized: you are not the vault owner',
  101: 'Invalid amount: must be a positive number',
  102: 'Vault not found',
  103: 'Vault is not active',
  104: 'Conditions not met for release',
  105: 'Already cancelled',
  106: 'Invalid condition type',
  107: 'Insufficient balance',
  108: 'Protocol is paused',
  109: 'Maximum co-signers reached',
  110: 'Already approved',
  200: 'Unauthorized: admin only',
  201: 'Invalid configuration value',
  300: 'Emergency stop is active',
  301: 'Emergency stop is not active',
}

/**
 * Get a human-readable message for a Clarity error code.
 */
export function clarityErrorMessage(errorCode: number): string {
  return CLARITY_ERROR_CODES[errorCode] || `Contract error (code ${errorCode})`
}
