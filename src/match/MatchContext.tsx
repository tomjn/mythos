import { createContext, useContext, useEffect, useReducer, useRef, useState, type ReactNode } from 'react'
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

/** Re-renders the caller every TICK_MS while running, returning a live `now`. */
export function useNow(running: boolean): number {
  const [now, setNow] = useState(() => Date.now())
  const ref = useRef(running)
  ref.current = running
  useEffect(() => {
    if (!running) { setNow(Date.now()); return }
    const id = setInterval(() => setNow(Date.now()), TICK_MS)
    return () => clearInterval(id)
  }, [running])
  return now
}

export type { PlayerIndex }
