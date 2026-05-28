import { useMatch, useNow } from '@/match/MatchContext'
import { liveClockMs } from '@/match/timing'
import type { PlayerIndex } from '@/match/types'
import { ClockDisplay } from './ClockDisplay'
import { StatTile } from './StatTile'
import { EdgePill } from './EdgePill'
import { BASE_CHAKRA } from '@/match/constants'

export function PlayerPanel({ index, flipped }: { index: PlayerIndex; flipped: boolean }) {
  const { match, dispatch } = useMatch()
  const running = match.active === index && !match.paused
  const now = useNow(running)
  const player = match.players[index]
  const clock = liveClockMs(match, index, now)

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
        aria-label={`Pass clock from ${player.name}`}
        onClick={() => dispatch({ type: 'TAP_HALF', player: index, now: Date.now() })}
        className="flex flex-1 items-center justify-center"
      >
        <ClockDisplay ms={clock} timedOut={player.timedOut} />
      </button>

      <div className="grid grid-cols-2">
        <StatTile
          label="CHAKRA"
          value={player.chakra}
          onInc={() => dispatch({ type: 'ADJUST_CHAKRA', player: index, delta: 1 })}
          onDec={() => dispatch({ type: 'ADJUST_CHAKRA', player: index, delta: -1 })}
          preset={BASE_CHAKRA}
          onPreset={() => dispatch({ type: 'ADJUST_CHAKRA', player: index, delta: BASE_CHAKRA })}
          onReset={() => dispatch({ type: 'RESET_CHAKRA', player: index })}
        />
        <StatTile
          label="MISSION"
          value={player.mission}
          onInc={() => dispatch({ type: 'ADJUST_MISSION', player: index, delta: 1 })}
          onDec={() => dispatch({ type: 'ADJUST_MISSION', player: index, delta: -1 })}
        />
      </div>
    </div>
  )
}
