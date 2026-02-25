/**
 * Validation utilities for form inputs and Stacks addresses.
 */

import { MAINNET_ADDRESS_PREFIX, TESTNET_ADDRESS_PREFIX } from './constants'

/**
 * Validate a Stacks address format.
 * Checks prefix (SP/ST) and basic length requirements.
 */
export function isValidStxAddress(address: string): boolean {
  if (!address || typeof address !== 'string') return false
  const trimmed = address.trim()
  const hasValidPrefix =
    trimmed.startsWith(MAINNET_ADDRESS_PREFIX) || trimmed.startsWith(TESTNET_ADDRESS_PREFIX)
  // Stacks addresses are typically 41 characters (standard) or up to ~66 for contract principals
  return hasValidPrefix && trimmed.length >= 38 && trimmed.length <= 66
}

/**
 * Validate a contract principal (address.contract-name format).
 */
export function isValidContractPrincipal(principal: string): boolean {
  if (!principal || !principal.includes('.')) return false
  const [address, name] = principal.split('.')
  return isValidStxAddress(address) && /^[a-zA-Z][a-zA-Z0-9-]*$/.test(name)
}

/**
 * Validate that a vault amount is positive and meets minimum.
 */
export function isValidAmount(amount: string, minAmount = 0): { valid: boolean; error?: string } {
  const num = parseFloat(amount)
  if (!amount || isNaN(num)) return { valid: false, error: 'Amount is required' }
  if (num <= 0) return { valid: false, error: 'Amount must be positive' }
  if (num < minAmount) return { valid: false, error: `Amount must be at least ${minAmount} STX` }
  return { valid: true }
}

/**
 * Validate a block height is a positive integer.
 */
export function isValidBlockHeight(value: string): { valid: boolean; error?: string } {
  const num = parseInt(value, 10)
  if (!value || isNaN(num)) return { valid: false, error: 'Block height is required' }
  if (num <= 0) return { valid: false, error: 'Block height must be positive' }
  if (!Number.isInteger(num)) return { valid: false, error: 'Block height must be an integer' }
  return { valid: true }
}

/**
 * Validate an inactivity threshold (blocks).
 */
export function isValidInactivityThreshold(
  value: string,
  minBlocks = 1,
): { valid: boolean; error?: string } {
  const num = parseInt(value, 10)
  if (!value || isNaN(num)) return { valid: false, error: 'Inactivity threshold is required' }
  if (num < minBlocks)
    return { valid: false, error: `Must be at least ${minBlocks} blocks` }
  return { valid: true }
}

/**
 * Validate a threshold approval count.
 */
export function isValidThreshold(
  value: string,
  maxCosigners: number,
): { valid: boolean; error?: string } {
  const num = parseInt(value, 10)
  if (!value || isNaN(num)) return { valid: false, error: 'Threshold is required' }
  if (num < 1) return { valid: false, error: 'At least 1 approval is required' }
  if (num > maxCosigners)
    return { valid: false, error: `Cannot exceed number of co-signers (${maxCosigners})` }
  return { valid: true }
}

/**
 * Validate a list of co-signer addresses.
 */
export function validateCosigners(
  cosigners: string[],
  ownerAddress: string,
  maxCosigners: number,
): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  const filtered = cosigners.filter((c) => c.trim() !== '')

  if (filtered.length > maxCosigners) {
    errors.push(`Maximum ${maxCosigners} co-signers allowed`)
  }

  const seen = new Set<string>()
  filtered.forEach((addr, i) => {
    if (!isValidStxAddress(addr)) {
      errors.push(`Co-signer ${i + 1}: Invalid address`)
    }
    if (addr === ownerAddress) {
      errors.push(`Co-signer ${i + 1}: Cannot add yourself as co-signer`)
    }
    if (seen.has(addr)) {
      errors.push(`Co-signer ${i + 1}: Duplicate address`)
    }
    seen.add(addr)
  })

  return { valid: errors.length === 0, errors }
}
