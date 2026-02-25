import { useState, useEffect } from 'react'

/**
 * Hook that tracks a CSS media query match state.
 *
 * @example
 * const isMobile = useMediaQuery('(max-width: 640px)')
 * const prefersDark = useMediaQuery('(prefers-color-scheme: dark)')
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia(query).matches
  })

  useEffect(() => {
    const mql = window.matchMedia(query)
    const handler = (event: MediaQueryListEvent) => setMatches(event.matches)

    mql.addEventListener('change', handler)
    setMatches(mql.matches)

    return () => mql.removeEventListener('change', handler)
  }, [query])

  return matches
}

/** Convenience breakpoint hooks */
export const useIsMobile = () => useMediaQuery('(max-width: 640px)')
export const useIsTablet = () => useMediaQuery('(max-width: 850px)')
export const useIsDesktop = () => useMediaQuery('(min-width: 851px)')
