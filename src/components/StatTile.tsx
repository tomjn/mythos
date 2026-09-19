import { useEffect, useRef, useState } from 'react'
import { RotateCcw } from 'lucide-react'
import { DELTA_WINDOW_MS } from '@/match/constants'

interface StatTileProps {
  label: string
  value: number
  onInc: () => void
  onDec: () => void
  onPlus5?: () => void
  onReset?: () => void
  displayFont?: boolean
}

export function StatTile({ label, value, onInc, onDec, onPlus5, onReset, displayFont }: StatTileProps) {
  const [spinKey, setSpinKey] = useState(0)

  // Running total of recent taps, shown above the value. It keeps adding up while
  // taps keep coming, fades after DELTA_WINDOW_MS without one, and the next tap
  // after that starts a fresh total.
  const [delta, setDelta] = useState({ amount: 0, visible: false })
  const hideTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  useEffect(() => () => clearTimeout(hideTimer.current), [])
  const bump = (by: number) => {
    setDelta((d) => ({ amount: (d.visible ? d.amount : 0) + by, visible: true }))
    clearTimeout(hideTimer.current)
    hideTimer.current = setTimeout(() => setDelta((d) => ({ ...d, visible: false })), DELTA_WINDOW_MS)
  }

  const handleReset = () => {
    setSpinKey((k) => k + 1)
    bump(-value)
    onReset?.()
  }

  return (
    <div className="flex flex-col items-center gap-1 px-3 pb-3">
      {/* Above the label, where an empty line reads as tile padding, not a gap. Fixed
          height so the tile does not jump when the delta appears. */}
      <div
        data-testid={`delta-${label}`}
        data-visible={String(delta.visible && delta.amount !== 0)}
        className="h-5 text-base font-bold tabular-nums leading-5 transition-opacity duration-500 motion-reduce:transition-none"
        style={{ opacity: delta.visible && delta.amount !== 0 ? 1 : 0 }}
      >
        {/* Same pop as the value below, replayed on each change via the key. */}
        <span key={delta.amount} className="value-pop inline-block">
          {delta.amount > 0 ? `+${delta.amount}` : delta.amount}
        </span>
      </div>
      <div className="flex h-7 items-center gap-2">
        <span className={`text-xs font-semibold tracking-widest opacity-80 ${displayFont ? 'font-ninja' : ''}`}>{label}</span>
        {onPlus5 && (
          <button type="button" aria-label={`+5 ${label}`} onClick={() => { bump(5); onPlus5() }}
            className="hover-lift rounded-full border px-2 py-1 text-xs font-bold tabular-nums opacity-80 active:scale-90 active:opacity-100"
            style={{ borderColor: 'var(--player-accent)' }}>+5</button>
        )}
        {onReset && (
          <button type="button" aria-label={`Reset ${label}`} onClick={handleReset}
            className="hover-lift rounded-full p-1 opacity-70 transition-transform duration-200 active:scale-90 active:opacity-100">
            <RotateCcw key={spinKey} size={16} className={spinKey > 0 ? 'reset-spin' : undefined} />
          </button>
        )}
      </div>
      <div key={value} className="value-pop text-4xl font-bold tabular-nums" style={{ color: 'var(--player-accent)' }}>{value}</div>
      <div className="mt-1 flex w-full gap-2">
        <button type="button" aria-label="-1" onClick={() => { bump(-1); onDec() }} disabled={value <= 0}
          className="hover-lift flex-1 rounded-lg border-2 py-3 text-lg font-bold active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100"
          style={{ background: 'var(--btn-minus-fill)', borderColor: 'var(--btn-minus-border)', borderWidth: 'var(--btn-border-width, 2px)', color: 'var(--btn-minus-ink)' }}>-1</button>
        <button type="button" aria-label="+1" onClick={() => { bump(1); onInc() }}
          className="hover-lift flex-1 rounded-lg border-2 py-3 text-lg font-bold active:scale-95"
          style={{ background: 'var(--btn-plus-fill)', borderColor: 'var(--btn-plus-border)', borderWidth: 'var(--btn-border-width, 2px)', color: 'var(--btn-plus-ink)' }}>+1</button>
      </div>
    </div>
  )
}
