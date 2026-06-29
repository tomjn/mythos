import { useMatch, useNow } from '@/match/MatchContext'
import { useTheme } from '@/match/ThemeContext'
import { panelVars, type PanelState } from '@/match/themes'
import { liveClockMs, liveRoundMs } from '@/match/timing'
import type { PlayerIndex } from '@/match/types'
import { ClockDisplay } from './ClockDisplay'
import { StatTile } from './StatTile'
import { EdgePill } from './EdgePill'

export function PlayerPanel({ index, flipped }: { index: PlayerIndex; flipped: boolean }) {
  const { match, dispatch } = useMatch()
  const { theme } = useTheme()
  const roundMode = match.roundTimer.enabled
  // Whose turn it is (independent of pause) drives the panel's look, so pausing
  // doesn't erase which player was on the clock. Ticking still requires unpaused.
  const isTurn = !roundMode && match.active === index
  const running = !match.paused && (roundMode || isTurn)
  const now = useNow(running)
  const player = match.players[index]
  const displayMs = roundMode ? liveRoundMs(match, now) : liveClockMs(match, index, now)
  const isActive = isTurn
  const isWaiting = !roundMode && match.active != null && !isTurn

  const state: PanelState = isActive ? 'active' : isWaiting ? 'waiting' : 'neutral'
  const vars = panelVars(theme, index, state)
  // On display-font themes the brush face squishes "Player 1"; split off the trailing
  // number so it can be badged (in the UI font) and stay distinct from the name.
  const nameMatch = theme.displayFont ? player.name.match(/^(.*?)(\d+)$/) : null

  return (
    <div
      data-flipped={flipped}
      data-running={isActive}
      className="relative flex h-full flex-col overflow-hidden rounded-2xl transition-[background-color,box-shadow,color] duration-300 motion-reduce:transition-none"
      style={{
        ...vars,
        background: vars['--player-bg'],
        color: vars['--player-accent'],
        transform: flipped ? 'rotate(180deg)' : undefined,
        boxShadow: isActive ? 'inset 0 0 0 4px var(--player-accent)' : 'inset 0 0 0 0 transparent',
      }}
    >
      <div className="flex items-center justify-between px-4 pt-3">
        <span className={`text-lg font-bold ${theme.displayFont ? 'font-ninja' : ''}`}>
          {nameMatch ? (
            <>
              {nameMatch[1]}
              <span
                className="ml-2 rounded px-1.5 font-sans tabular-nums"
                style={{ background: 'var(--player-accent)', color: 'var(--player-bg)' }}
              >
                {nameMatch[2]}
              </span>
            </>
          ) : (
            player.name
          )}
        </span>
        <EdgePill active={match.edge === index} onToggle={() => dispatch({ type: 'SET_EDGE', player: index })} />
      </div>

      <button
        type="button"
        data-testid={`tap-surface-${index}`}
        aria-label={roundMode ? 'Shared round timer running' : match.active == null ? `Start ${player.name}'s clock` : `Pass clock from ${player.name}`}
        onClick={roundMode ? undefined : () => dispatch({ type: 'TAP_HALF', player: index, now: Date.now() })}
        disabled={roundMode}
        className="flex flex-1 items-center justify-center transition-transform duration-100 active:scale-95 disabled:cursor-default disabled:active:scale-100 motion-reduce:transition-none motion-reduce:active:scale-100"
      >
        <ClockDisplay ms={displayMs} timedOut={roundMode ? false : player.timedOut} paused={match.paused && (roundMode || isTurn)} />
      </button>

      <div className="grid grid-cols-2">
        <StatTile
          label="CHAKRA"
          value={player.chakra}
          onInc={() => dispatch({ type: 'ADJUST_CHAKRA', player: index, delta: 1 })}
          onDec={() => dispatch({ type: 'ADJUST_CHAKRA', player: index, delta: -1 })}
          onReset={() => dispatch({ type: 'RESET_CHAKRA', player: index })}
          displayFont={theme.displayFont}
        />
        <StatTile
          label="MISSION"
          value={player.mission}
          onInc={() => dispatch({ type: 'ADJUST_MISSION', player: index, delta: 1 })}
          onDec={() => dispatch({ type: 'ADJUST_MISSION', player: index, delta: -1 })}
          onReset={() => dispatch({ type: 'RESET_MISSION', player: index })}
          displayFont={theme.displayFont}
        />
      </div>
    </div>
  )
}
