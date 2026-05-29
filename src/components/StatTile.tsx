import { RotateCcw } from 'lucide-react'

interface StatTileProps {
  label: string
  value: number
  onInc: () => void
  onDec: () => void
  onReset?: () => void
}

export function StatTile({ label, value, onInc, onDec, onReset }: StatTileProps) {
  return (
    <div className="flex flex-col items-center gap-2 p-3">
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold tracking-widest opacity-80">{label}</span>
        {onReset && (
          <button aria-label={`Reset ${label}`} onClick={onReset} className="opacity-70 active:opacity-100">
            <RotateCcw size={16} />
          </button>
        )}
      </div>
      <div className="text-4xl font-bold tabular-nums" style={{ color: 'var(--player-accent)' }}>{value}</div>
      <div className="flex w-full gap-2">
        <button aria-label="-1" onClick={onDec}
          className="flex-1 rounded-lg py-3 text-lg font-bold active:scale-95"
          style={{ background: 'var(--player-surface)' }}>-1</button>
        <button aria-label="+1" onClick={onInc}
          className="flex-1 rounded-lg py-3 text-lg font-bold active:scale-95"
          style={{ background: 'var(--player-accent)', color: 'var(--player-accent-fg)' }}>+1</button>
      </div>
    </div>
  )
}
