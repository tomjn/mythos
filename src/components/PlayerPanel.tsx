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

  return (
    <div
      data-flipped={flipped}
      className={`theme-${index === 0 ? 'p1' : 'p2'} relative flex h-full flex-col`}
      style={{ background: 'var(--player-bg)', color: 'var(--player-accent)', transform: flipped ? 'rotate(180deg)' : undefined }}
    >
      <div className="flex items-center justify-between px-4 pt-3">
        <span className="text-lg font-bold">{player.name}</span>
        <EdgePill active={match.edge === index} onToggle={() => dispatch({ type: 'SET_EDGE', player: index })} />
      </div>

      <button
        data-testid={`tap-surface-${index}`}
        aria-label={roundMode ? 'Shared round timer running' : `Pass clock from ${player.name}`}
        onClick={roundMode ? undefined : () => dispatch({ type: 'TAP_HALF', player: index, now: Date.now() })}
        disabled={roundMode}
        className="flex flex-1 items-center justify-center disabled:cursor-default"
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
