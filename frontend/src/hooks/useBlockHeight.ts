import { useState, useEffect, useRef } from 'react'
import { getCurrentBlockHeight } from '@/lib/api'

/**
 * Hook that provides the current Stacks block height.
 * Polls the API at a configurable interval (default: 60s).
 */
export const useBlockHeight = (pollInterval = 60_000) => {
  const [blockHeight, setBlockHeight] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    let mounted = true

    const fetchBlock = async () => {
      try {
        const height = await getCurrentBlockHeight()
        if (mounted) {
          setBlockHeight(height)
          setError(null)
        }
      } catch {
        if (mounted) setError('Failed to fetch block height')
      } finally {
        if (mounted) setLoading(false)
      }
    }

    fetchBlock()
    intervalRef.current = setInterval(fetchBlock, pollInterval)

    return () => {
      mounted = false
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [pollInterval])

  return { blockHeight, loading, error }
}
