import { formatMs } from '@/match/format'
import { WARN_MS, DANGER_MS } from '@/match/constants'

export function ClockDisplay({ ms, timedOut }: { ms: number; timedOut: boolean }) {
  const danger = timedOut || ms <= DANGER_MS
  const warn = !danger && ms <= WARN_MS
  const level = danger ? 'danger' : warn ? 'warn' : 'normal'
  return (
    <div
      data-testid="clock"
      data-timedout={timedOut}
      data-level={level}
      className={`text-center font-mono font-bold tabular-nums leading-none transition-colors duration-300 ${danger ? 'animate-pulse' : ''}`}
      style={{
        fontSize: 'clamp(3rem, 14vw, 6rem)',
        color: danger
          ? 'var(--clock-danger, #ef4444)'
          : warn
            ? 'var(--clock-warn, #fbbf24)'
            : 'var(--player-accent)',
      }}
    >
      {formatMs(ms)}
    </div>
  )
}
