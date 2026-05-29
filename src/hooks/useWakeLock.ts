import { useEffect } from 'react'

type SentinelLike = { release: () => Promise<void> }
type WakeLockNav = { wakeLock?: { request: (t: 'screen') => Promise<SentinelLike> } }

export function useWakeLock(active: boolean): void {
  useEffect(() => {
    if (!active) return
    const wl = (navigator as unknown as WakeLockNav).wakeLock
    if (!wl) return

    let sentinel: SentinelLike | null = null
    let cancelled = false

    const acquire = () => {
      if (cancelled || document.visibilityState !== 'visible') return
      wl.request('screen').then((s) => {
        if (cancelled) { s.release().catch(() => {}); return }
        sentinel = s
      }).catch(() => {})
    }

    acquire()

    // The OS releases the wake lock whenever the page is hidden (screen off,
    // app switch). Re-acquire it when the page becomes visible again so the
    // screen reliably stays awake across a long match.
    const onVisibility = () => { if (document.visibilityState === 'visible') acquire() }
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', onVisibility)
      sentinel?.release().catch(() => {})
    }
  }, [active])
}
