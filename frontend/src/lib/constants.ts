/**
 * Application-wide constants for the Deadman Protocol frontend.
 */

/** Average Stacks block time in minutes */
export const BLOCK_TIME_MINUTES = 10

/** Average Stacks block time in seconds */
export const BLOCK_TIME_SECONDS = BLOCK_TIME_MINUTES * 60

/** Blocks per hour (approximate) */
export const BLOCKS_PER_HOUR = 6

/** Blocks per day (approximate) */
export const BLOCKS_PER_DAY = BLOCKS_PER_HOUR * 24

/** Blocks per week (approximate) */
export const BLOCKS_PER_WEEK = BLOCKS_PER_DAY * 7

/** Minimum vault amount in microSTX */
export const MIN_VAULT_AMOUNT = 1_000_000

/** STX to microSTX conversion factor */
export const STX_DECIMALS = 6
export const MICRO_STX = 10 ** STX_DECIMALS

/** Address prefixes */
export const MAINNET_ADDRESS_PREFIX = 'SP'
export const TESTNET_ADDRESS_PREFIX = 'ST'

/** Local storage keys */
export const STORAGE_KEYS = {
  THEME: 'deadman-theme',
  RECENT_VAULTS: 'deadman-recent-vaults',
  DISMISSED_ALERTS: 'deadman-dismissed-alerts',
} as const

/** External links */
export const LINKS = {
  GITHUB: 'https://github.com/Yusufolosun/deadman-protocol',
  DOCS: 'https://github.com/Yusufolosun/deadman-protocol/tree/main/docs',
  STACKS_EXPLORER_TESTNET: 'https://explorer.hiro.so/?chain=testnet',
  STACKS_EXPLORER_MAINNET: 'https://explorer.hiro.so/?chain=mainnet',
  STACKS_API_TESTNET: 'https://api.testnet.hiro.so',
  STACKS_API_MAINNET: 'https://api.hiro.so',
} as const

/** Condition type labels */
export const CONDITION_LABELS: Record<number, string> = {
  1: 'Block Height',
  2: 'Inactivity',
  3: 'Threshold Approval',
}

/** Condition type descriptions */
export const CONDITION_DESCRIPTIONS: Record<number, string> = {
  1: 'Assets release after a specific block height is reached.',
  2: 'Assets release if the owner is inactive for a defined number of blocks.',
  3: 'Assets release when enough co-signers approve the activation.',
}

/** Vault status labels */
export const STATUS_LABELS: Record<number, string> = {
  0: 'Active',
  1: 'Released',
  2: 'Cancelled',
}

/** Transaction status */
export const TX_STATUS = {
  PENDING: 'pending',
  SUCCESS: 'success',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
} as const

export type TxStatus = (typeof TX_STATUS)[keyof typeof TX_STATUS]
