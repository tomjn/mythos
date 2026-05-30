import { useMatch, useNow } from '@/match/MatchContext'
import { liveClockMs, liveRoundMs } from '@/match/timing'
import type { PlayerIndex } from '@/match/types'
import { ClockDisplay } from './ClockDisplay'
import { StatTile } from './StatTile'
import { EdgePill } from './EdgePill'

export function PlayerPanel({ index, flipped }: { index: PlayerIndex; flipped: boolean }) {
  const { match, dispatch } = useMatch()
  const roundMode = match.roundTimer.enabled
  const running = roundMode ? !match.paused : match.active === index && !match.paused
  const now = useNow(running)
  const player = match.players[index]
  const displayMs = roundMode ? liveRoundMs(match, now) : liveClockMs(match, index, now)
  const isActive = !roundMode && !match.paused && match.active === index
  const isWaiting = !roundMode && !match.paused && match.active != null && match.active !== index

  return (
    <div
      data-flipped={flipped}
      data-running={isActive}
      className={`theme-${index === 0 ? 'p1' : 'p2'} relative flex h-full flex-col overflow-hidden rounded-2xl transition-[background-color,box-shadow] duration-300 motion-reduce:transition-none`}
      style={{
        // Only the base fill dims while waiting — the clock, counters and every
        // button keep their own full-strength colours so the opponent can still
        // read (and adjust) the other half at any time.
        background: isWaiting ? 'color-mix(in srgb, var(--player-bg) 30%, #171717)' : 'var(--player-bg)',
        color: 'var(--player-accent)',
        transform: flipped ? 'rotate(180deg)' : undefined,
        boxShadow: isActive ? 'inset 0 0 0 4px var(--player-accent)' : 'inset 0 0 0 0 transparent',
      }}
    >
      <div className="flex items-center justify-between px-4 pt-3">
        <span className="text-lg font-bold">{player.name}</span>
        <EdgePill active={match.edge === index} onToggle={() => dispatch({ type: 'SET_EDGE', player: index })} />
      </div>

      <button
        data-testid={`tap-surface-${index}`}
        aria-label={roundMode ? 'Shared round timer running' : match.active == null ? `Start ${player.name}'s clock` : `Pass clock from ${player.name}`}
        onClick={roundMode ? undefined : () => dispatch({ type: 'TAP_HALF', player: index, now: Date.now() })}
        disabled={roundMode}
        className="flex flex-1 items-center justify-center transition-transform duration-100 active:scale-95 disabled:cursor-default disabled:active:scale-100 motion-reduce:transition-none motion-reduce:active:scale-100"
      >
        <ClockDisplay ms={displayMs} timedOut={roundMode ? false : player.timedOut} />
      </button>

      <div className="grid grid-cols-2">
        <StatTile
          label="CHAKRA"
          value={player.chakra}
          onInc={() => dispatch({ type: 'ADJUST_CHAKRA', player: index, delta: 1 })}
          onDec={() => dispatch({ type: 'ADJUST_CHAKRA', player: index, delta: -1 })}
          onReset={() => dispatch({ type: 'RESET_CHAKRA', player: index })}
        />
        <StatTile
          label="MISSION"
          value={player.mission}
          onInc={() => dispatch({ type: 'ADJUST_MISSION', player: index, delta: 1 })}
          onDec={() => dispatch({ type: 'ADJUST_MISSION', player: index, delta: -1 })}
          onReset={() => dispatch({ type: 'RESET_MISSION', player: index })}
        />
      </div>
    </div>
  )
}
