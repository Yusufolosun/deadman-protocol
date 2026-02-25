/**
 * Stacks API client for fetching blockchain data.
 * Uses the Hiro API for account info, transaction status, etc.
 */

const getApiBase = (): string => {
  return import.meta.env.VITE_API_URL || 'https://api.testnet.hiro.so'
}

interface ApiResponse<T> {
  data: T | null
  error: string | null
}

async function fetchApi<T>(endpoint: string): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${getApiBase()}${endpoint}`)
    if (!response.ok) {
      return { data: null, error: `HTTP ${response.status}: ${response.statusText}` }
    }
    const data = (await response.json()) as T
    return { data, error: null }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Network request failed'
    return { data: null, error: message }
  }
}

/** Account balance info */
export interface AccountBalance {
  stx: {
    balance: string
    total_sent: string
    total_received: string
    locked: string
  }
}

/** Transaction info from API */
export interface TransactionInfo {
  tx_id: string
  tx_status: 'success' | 'pending' | 'abort_by_response' | 'abort_by_post_condition'
  tx_type: string
  block_height?: number
  burn_block_time?: number
}

/** Block info */
export interface BlockInfo {
  height: number
  hash: string
  burn_block_time: number
}

/**
 * Fetch account STX balance.
 */
export async function getAccountBalance(address: string): Promise<ApiResponse<AccountBalance>> {
  return fetchApi<AccountBalance>(`/extended/v1/address/${address}/balances`)
}

/**
 * Fetch transaction status by ID.
 */
export async function getTransactionStatus(txId: string): Promise<ApiResponse<TransactionInfo>> {
  return fetchApi<TransactionInfo>(`/extended/v1/tx/${txId}`)
}

/**
 * Fetch current block height.
 */
export async function getCurrentBlockHeight(): Promise<number | null> {
  const result = await fetchApi<BlockInfo>('/extended/v1/block?limit=1')
  return result.data?.height ?? null
}

/**
 * Fetch recent transactions for an address.
 */
export async function getAddressTransactions(
  address: string,
  limit = 10,
): Promise<ApiResponse<{ results: TransactionInfo[] }>> {
  return fetchApi(`/extended/v1/address/${address}/transactions?limit=${limit}`)
}
