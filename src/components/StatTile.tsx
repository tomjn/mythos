import { useState } from 'react'
import { RotateCcw } from 'lucide-react'

interface StatTileProps {
  label: string
  value: number
  onInc: () => void
  onDec: () => void
  onReset?: () => void
}

export function StatTile({ label, value, onInc, onDec, onReset }: StatTileProps) {
  const [spinKey, setSpinKey] = useState(0)
  const handleReset = () => {
    setSpinKey((k) => k + 1)
    onReset?.()
  }

  return (
    <div className="flex flex-col items-center gap-2 p-3">
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold tracking-widest opacity-80">{label}</span>
        {onReset && (
          <button aria-label={`Reset ${label}`} onClick={handleReset}
            className="hover-lift rounded-full p-1 opacity-70 transition-transform duration-200 active:scale-90 active:opacity-100">
            <RotateCcw key={spinKey} size={16} className={spinKey > 0 ? 'reset-spin' : undefined} />
          </button>
        )}
      </div>
      <div key={value} className="value-pop text-4xl font-bold tabular-nums" style={{ color: 'var(--player-accent)' }}>{value}</div>
      <div className="flex w-full gap-2">
        <button aria-label="-1" onClick={onDec} disabled={value <= 0}
          className="hover-lift flex-1 rounded-lg py-3 text-lg font-bold active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100"
          style={{ background: 'var(--player-surface)' }}>-1</button>
        <button aria-label="+1" onClick={onInc}
          className="hover-lift flex-1 rounded-lg py-3 text-lg font-bold active:scale-95"
          style={{ background: 'var(--player-accent)', color: 'var(--player-accent-fg)' }}>+1</button>
      </div>
    </div>
  )
}
