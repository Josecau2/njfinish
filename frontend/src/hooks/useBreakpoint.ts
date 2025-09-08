import { useEffect, useState } from 'react'

const queries = {
  mobile: '(max-width: 576px)',
  desktop: '(min-width: 577px)'
} as const

export function useBreakpoint(name: keyof typeof queries = 'mobile'){
  const q = queries[name]
  const [match, setMatch] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(q).matches : false,
  )
  useEffect(() => {
    const mql = window.matchMedia(q)
    const on = (e: MediaQueryListEvent) => setMatch(e.matches)
    // Support old/new APIs
    if (mql.addEventListener) mql.addEventListener('change', on)
    else mql.addListener(on)
    return () => {
      if (mql.removeEventListener) mql.removeEventListener('change', on)
      else mql.removeListener(on)
    }
  }, [q])
  return match
}
