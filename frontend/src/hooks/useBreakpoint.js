import { useEffect, useState } from 'react'

const Q = { mobile: '(max-width: 576px)', desktop: '(min-width: 577px)' }

export function useBreakpoint(name = 'mobile') {
  const q = Q[name]
  const [match, setMatch] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(q).matches,
  )

  useEffect(() => {
    const mql = window.matchMedia(q)
    const on = (e) => setMatch(e.matches)
    mql.addEventListener?.('change', on) || mql.addListener(on)
    return () => mql.removeEventListener?.('change', on) || mql.removeListener(on)
  }, [q])

  return match
}
