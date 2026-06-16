import { formatMs } from '@/match/format'
import { WARN_MS, DANGER_MS } from '@/match/constants'

export function ClockDisplay({ ms, timedOut, paused = false }: { ms: number; timedOut: boolean; paused?: boolean }) {
  const danger = timedOut || ms <= DANGER_MS
  const warn = !danger && ms <= WARN_MS
  const level = danger ? 'danger' : warn ? 'warn' : 'normal'
  // While paused the slow fade takes over from the danger pulse — the clock isn't
  // ticking down, so "paused" is the more useful signal.
  const pulse = paused ? 'paused-fade' : danger ? 'animate-pulse' : ''
  return (
    <div
      data-testid="clock"
      data-timedout={timedOut}
      data-level={level}
      className={`text-center font-mono font-bold tabular-nums leading-none transition-colors duration-300 ${pulse}`}
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
