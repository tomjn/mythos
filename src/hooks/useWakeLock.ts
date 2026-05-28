import { useEffect } from 'react'

type SentinelLike = { release: () => Promise<void> }

export function useWakeLock(active: boolean): void {
  useEffect(() => {
    if (!active) return
    const anyNav = navigator as unknown as { wakeLock?: { request: (t: 'screen') => Promise<SentinelLike> } }
    if (!anyNav.wakeLock) return
    let sentinel: SentinelLike | null = null
    let cancelled = false
    anyNav.wakeLock.request('screen').then((s) => {
      if (cancelled) { s.release().catch(() => {}); return }
      sentinel = s
    }).catch(() => {})
    return () => {
      cancelled = true
      sentinel?.release().catch(() => {})
    }
  }, [active])
}
