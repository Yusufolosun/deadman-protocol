import { useState, useEffect, useCallback, useRef } from 'react'

/**
 * Hook that debounces a value by the specified delay.
 * Useful for search inputs that trigger API calls.
 *
 * @example
 * const [search, setSearch] = useState('')
 * const debouncedSearch = useDebounce(search, 300)
 *
 * useEffect(() => { fetchResults(debouncedSearch) }, [debouncedSearch])
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debounced
}

/**
 * Hook that returns a debounced version of a callback function.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useDebouncedCallback<T extends (...args: any[]) => void>(
  callback: T,
  delay: number,
): (...args: Parameters<T>) => void {
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const debounced = useCallback(
    (...args: Parameters<T>) => {
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => callback(...args), delay)
    },
    [callback, delay],
  )

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  return debounced
}
