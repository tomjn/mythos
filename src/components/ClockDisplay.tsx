import { formatMs } from '@/match/format'
import { WARN_MS, DANGER_MS } from '@/match/constants'

const DANGER_COLOR = '#ef4444' // red
const WARN_COLOR = '#fbbf24' // amber

export function ClockDisplay({ ms, timedOut }: { ms: number; timedOut: boolean }) {
  const danger = timedOut || ms <= DANGER_MS
  const warn = !danger && ms <= WARN_MS
  const level = danger ? 'danger' : warn ? 'warn' : 'normal'
  return (
    <div
      data-testid="clock"
      data-timedout={timedOut}
      data-level={level}
      className={`text-center font-mono font-bold tabular-nums leading-none ${danger ? 'animate-pulse' : ''}`}
      style={{
        fontSize: 'clamp(3rem, 14vw, 6rem)',
        color: danger ? DANGER_COLOR : warn ? WARN_COLOR : 'var(--player-accent)',
      }}
    >
      {formatMs(ms)}
    </div>
  )
}
