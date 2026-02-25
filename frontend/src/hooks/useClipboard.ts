import { useState, useCallback } from 'react'
import { copyToClipboard } from '@/lib/clipboard'

/**
 * Hook for copying text to clipboard with success feedback.
 *
 * @example
 * const { copied, copy } = useClipboard(2000)
 * <button onClick={() => copy('hello')}>
 *   {copied ? 'Copied!' : 'Copy'}
 * </button>
 */
export function useClipboard(resetDelay = 2000) {
  const [copied, setCopied] = useState(false)

  const copy = useCallback(
    async (text: string) => {
      const ok = await copyToClipboard(text)
      if (ok) {
        setCopied(true)
        setTimeout(() => setCopied(false), resetDelay)
      }
      return ok
    },
    [resetDelay],
  )

  return { copied, copy }
}
