import { useState, useCallback, useRef, useEffect } from 'react'
import { getTransactionStatus } from '@/lib/api'
import type { TxStatus } from '@/lib/constants'
import { TX_STATUS } from '@/lib/constants'

interface TrackedTransaction {
  txId: string
  status: TxStatus
  label: string
  timestamp: number
}

/**
 * Hook for tracking transaction status after submission.
 * Polls the Stacks API until the transaction is confirmed or fails.
 */
export const useTransactionTracker = () => {
  const [transactions, setTransactions] = useState<TrackedTransaction[]>([])
  const pollIntervals = useRef<Map<string, ReturnType<typeof setInterval>>>(new Map())

  const updateTransaction = useCallback((txId: string, status: TxStatus) => {
    setTransactions((prev) =>
      prev.map((tx) => (tx.txId === txId ? { ...tx, status } : tx)),
    )
  }, [])

  const stopPolling = useCallback((txId: string) => {
    const interval = pollIntervals.current.get(txId)
    if (interval) {
      clearInterval(interval)
      pollIntervals.current.delete(txId)
    }
  }, [])

  const trackTransaction = useCallback(
    (txId: string, label: string) => {
      const newTx: TrackedTransaction = {
        txId,
        status: TX_STATUS.PENDING,
        label,
        timestamp: Date.now(),
      }
      setTransactions((prev) => [newTx, ...prev])

      // Poll for status every 10 seconds
      const interval = setInterval(async () => {
        const result = await getTransactionStatus(txId)
        if (!result.data) return

        const apiStatus = result.data.tx_status
        if (apiStatus === 'success') {
          updateTransaction(txId, TX_STATUS.SUCCESS)
          stopPolling(txId)
        } else if (
          apiStatus === 'abort_by_response' ||
          apiStatus === 'abort_by_post_condition'
        ) {
          updateTransaction(txId, TX_STATUS.FAILED)
          stopPolling(txId)
        }
        // Keep polling if still pending
      }, 10_000)

      pollIntervals.current.set(txId, interval)
    },
    [updateTransaction, stopPolling],
  )

  const clearTransaction = useCallback(
    (txId: string) => {
      stopPolling(txId)
      setTransactions((prev) => prev.filter((tx) => tx.txId !== txId))
    },
    [stopPolling],
  )

  // Cleanup intervals on unmount
  useEffect(() => {
    return () => {
      pollIntervals.current.forEach((interval) => clearInterval(interval))
      pollIntervals.current.clear()
    }
  }, [])

  const pendingCount = transactions.filter((tx) => tx.status === TX_STATUS.PENDING).length

  return {
    transactions,
    trackTransaction,
    clearTransaction,
    pendingCount,
  }
}
