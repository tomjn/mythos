import { useSyncExternalStore } from 'react'

// A phone laid on its side (short landscape) switches the match to a side-by-side
// 2-column layout, so the device can be positioned however the players like.
// Taller landscape viewports (tablets, desktop windows) keep the stacked layout.
const QUERY = '(orientation: landscape) and (max-height: 600px)'

// matchMedia is absent under jsdom/SSR; treat those as "not split" (stacked).
const supported = () => typeof window !== 'undefined' && typeof window.matchMedia === 'function'

function subscribe(onChange: () => void): () => void {
  if (!supported()) return () => {}
  const mql = window.matchMedia(QUERY)
  mql.addEventListener('change', onChange)
  return () => mql.removeEventListener('change', onChange)
}

const getSnapshot = () => (supported() ? window.matchMedia(QUERY).matches : false)

export function useSplitLayout(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, () => false)
}
