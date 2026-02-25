/**
 * Formatting utilities for the Deadman Protocol frontend.
 *
 * Provides human-readable formatting for STX amounts, addresses,
 * block heights, and time durations.
 */

import { BLOCK_TIME_MINUTES, MICRO_STX, STX_DECIMALS } from './constants'

/**
 * Format microSTX to human-readable STX amount.
 * @example formatSTX(1500000) => "1.500000"
 */
export function formatSTX(microStx: number): string {
  const stx = microStx / MICRO_STX
  return stx.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: STX_DECIMALS,
  })
}

/**
 * Format STX with compact notation for large amounts.
 * @example formatSTXCompact(1250000000) => "1.25K STX"
 */
export function formatSTXCompact(microStx: number): string {
  const stx = microStx / MICRO_STX
  if (stx >= 1_000_000) return `${(stx / 1_000_000).toFixed(2)}M STX`
  if (stx >= 1_000) return `${(stx / 1_000).toFixed(2)}K STX`
  return `${stx.toLocaleString()} STX`
}

/**
 * Convert STX string input to microSTX.
 * @example stxToMicro("1.5") => 1500000
 */
export function stxToMicro(stx: string): number {
  const value = parseFloat(stx)
  if (isNaN(value) || value < 0) return 0
  return Math.floor(value * MICRO_STX)
}

/**
 * Truncate a Stacks address for display.
 * @example truncateAddress("ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM") => "ST1PQ...GZGM"
 */
export function truncateAddress(address: string, startLen = 5, endLen = 4): string {
  if (!address) return ''
  if (address.length <= startLen + endLen + 3) return address
  return `${address.slice(0, startLen)}...${address.slice(-endLen)}`
}

/**
 * Convert a block count to approximate human-readable time string.
 * @example blocksToTime(144) => "1 day"
 * @example blocksToTime(2016) => "2 weeks"
 */
export function blocksToTime(blocks: number): string {
  const totalMinutes = blocks * BLOCK_TIME_MINUTES

  if (totalMinutes < 60) return `${totalMinutes} min`

  const hours = totalMinutes / 60
  if (hours < 24) return `${Math.round(hours)} hr${Math.round(hours) !== 1 ? 's' : ''}`

  const days = hours / 24
  if (days < 7) return `${Math.round(days)} day${Math.round(days) !== 1 ? 's' : ''}`

  const weeks = days / 7
  if (weeks < 4) return `${Math.round(weeks)} week${Math.round(weeks) !== 1 ? 's' : ''}`

  const months = days / 30
  return `~${Math.round(months)} month${Math.round(months) !== 1 ? 's' : ''}`
}

/**
 * Format a block height with hash prefix and locale separators.
 * @example formatBlockHeight(144200) => "#144,200"
 */
export function formatBlockHeight(block: number): string {
  return `#${block.toLocaleString()}`
}

/**
 * Format a relative time string from a block number.
 * @example formatRelativeBlocks(1440, 1000) => "in ~440 blocks (~3 days)"
 */
export function formatRelativeBlocks(targetBlock: number, currentBlock: number): string {
  const diff = targetBlock - currentBlock
  if (diff <= 0) return 'condition met'
  return `in ~${diff.toLocaleString()} blocks (~${blocksToTime(diff)})`
}

/**
 * Format a number as a percentage.
 * @example formatPercent(50, 100) => "50%"
 */
export function formatPercent(value: number, total: number): string {
  if (total === 0) return '0%'
  return `${Math.round((value / total) * 100)}%`
}

/**
 * Format a date from block height (rough estimate).
 * Assumes current block is known.
 */
export function estimateDateFromBlock(targetBlock: number, currentBlock: number): string {
  const diff = targetBlock - currentBlock
  if (diff <= 0) return 'Now'
  const minutesFromNow = diff * BLOCK_TIME_MINUTES
  const futureDate = new Date(Date.now() + minutesFromNow * 60_000)
  return futureDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}
