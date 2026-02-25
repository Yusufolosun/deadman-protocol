/**
 * Stacks explorer URL helpers.
 */

import { LINKS } from './constants'

const getExplorerBase = (): string => {
  const network = import.meta.env.VITE_NETWORK || 'testnet'
  return network === 'mainnet' ? LINKS.STACKS_EXPLORER_MAINNET : LINKS.STACKS_EXPLORER_TESTNET
}

/**
 * Get explorer URL for a transaction.
 */
export function getTransactionUrl(txId: string): string {
  return `${getExplorerBase()}&txId=${txId}`
}

/**
 * Get explorer URL for a Stacks address.
 */
export function getAddressUrl(address: string): string {
  return `${getExplorerBase()}&address=${address}`
}

/**
 * Get explorer URL for a block height.
 */
export function getBlockUrl(blockHeight: number): string {
  return `${getExplorerBase()}&block=${blockHeight}`
}

/**
 * Get explorer URL for a contract.
 */
export function getContractUrl(contractId: string): string {
  return `${getExplorerBase()}&contractId=${contractId}`
}
