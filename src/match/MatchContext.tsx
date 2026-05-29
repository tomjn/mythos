import { createContext, useContext, useEffect, useReducer, type ReactNode } from 'react'
import type { Match, MatchAction, PlayerIndex } from './types'
import { matchReducer } from './reducer'
import { createInitialMatch } from './state'
import { loadMatch, saveMatch } from './storage'
import { liveClockMs } from './timing'
import { TICK_MS } from './constants'

interface MatchContextValue {
  match: Match
  dispatch: React.Dispatch<MatchAction>
}

const MatchContext = createContext<MatchContextValue | null>(null)

function init(): Match {
  return loadMatch() ?? createInitialMatch()
}

export function MatchProvider({ children }: { children: ReactNode }) {
  const [match, dispatch] = useReducer(matchReducer, undefined, init)

  // Persist on every state change.
  useEffect(() => { saveMatch(match) }, [match])

  // Detect the active player's clock hitting zero and flag a timeout once.
  useEffect(() => {
    if (match.active == null || match.paused) return
    const idx = match.active
    if (match.players[idx].timedOut) return
    const id = setInterval(() => {
      const now = Date.now()
      if (liveClockMs(match, idx, now) <= 0) {
        navigator.vibrate?.([300, 120, 300]) // buzz on time-out (Android; no-op where unsupported)
        dispatch({ type: 'TIMEOUT', player: idx, now })
      }
    }, TICK_MS)
    return () => clearInterval(id)
  }, [match])

  return <MatchContext.Provider value={{ match, dispatch }}>{children}</MatchContext.Provider>
}

export function useMatch(): MatchContextValue {
  const ctx = useContext(MatchContext)
  if (!ctx) throw new Error('useMatch must be used within MatchProvider')
  return ctx
}

/**
 * Returns the current time, read fresh on every render so a panel that just
 * became active reflects the correct time immediately (no stale jump). While
 * `running`, an interval forces a re-render every TICK_MS so the clock advances.
 */
export function useNow(running: boolean): number {
  const [, forceTick] = useReducer((n: number) => n + 1, 0)
  useEffect(() => {
    if (!running) return
    const id = setInterval(forceTick, TICK_MS)
    return () => clearInterval(id)
  }, [running])
  return Date.now()
}

export type { PlayerIndex }
