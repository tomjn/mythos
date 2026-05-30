import { useEffect, useState } from 'react'

// A phone laid on its side (short landscape) switches the match to a side-by-side
// 2-column layout, so the device can be positioned however the players like.
// Taller landscape viewports (tablets, desktop windows) keep the stacked layout.
// matchMedia is absent under jsdom/SSR, so guard for it and default to stacked.
const QUERY = '(orientation: landscape) and (max-height: 600px)'

export function useSplitLayout(): boolean {
  const [split, setSplit] = useState(
    () => typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia(QUERY).matches,
  )

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return
    const mql = window.matchMedia(QUERY)
    const onChange = () => setSplit(mql.matches)
    onChange()
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [])

  return split
}
