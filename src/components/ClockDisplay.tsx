import { formatMs } from '@/match/format'

export function ClockDisplay({ ms, timedOut }: { ms: number; timedOut: boolean }) {
  return (
    <div
      data-testid="clock"
      data-timedout={timedOut}
      className="text-center font-mono font-bold tabular-nums leading-none data-[timedout=true]:animate-pulse"
      style={{ fontSize: 'clamp(3rem, 14vw, 6rem)', color: 'var(--player-accent)' }}
    >
      {formatMs(ms)}
    </div>
  )
}
