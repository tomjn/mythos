import type { Match, MatchAction, Player, PlayerIndex } from './types'
import { createInitialMatch } from './state'
import { BASE_CHAKRA, MIN_START_MS } from './constants'

function settle(m: Match, now: number): Match {
  let players = m.players
  if (m.active != null && !m.paused && m.activeSince != null) {
    const idx = m.active
    const remaining = Math.max(0, m.players[idx].clockMs - (now - m.activeSince))
    const updated: Player = { ...m.players[idx], clockMs: remaining, timedOut: remaining === 0 ? true : m.players[idx].timedOut }
    players = idx === 0 ? [updated, m.players[1]] : [m.players[0], updated]
  }
  let roundTimer = m.roundTimer
  if (roundTimer.enabled && !m.paused && m.roundSince != null) {
    roundTimer = { ...roundTimer, remainingMs: Math.max(0, roundTimer.remainingMs - (now - m.roundSince)) }
  }
  const running = m.active != null && !m.paused
  return {
    ...m,
    players,
    roundTimer,
    activeSince: running ? now : null,
    roundSince: roundTimer.enabled && running ? now : null,
  }
}

function setPlayer(m: Match, index: PlayerIndex, patch: Partial<Player>): Match {
  const updated = { ...m.players[index], ...patch }
  const players: [Player, Player] = index === 0 ? [updated, m.players[1]] : [m.players[0], updated]
  return { ...m, players }
}

export function matchReducer(m: Match, action: MatchAction): Match {
  switch (action.type) {
    case 'TAP_HALF': {
      const settled = settle(m, action.now)
      const next: PlayerIndex = action.player === 0 ? 1 : 0
      return { ...settled, paused: false, active: next, activeSince: action.now,
        roundSince: settled.roundTimer.enabled ? action.now : null }
    }
    case 'PAUSE': {
      const settled = settle(m, action.now)
      return { ...settled, paused: true, activeSince: null, roundSince: null }
    }
    case 'RESUME': {
      const runClock = m.active != null
      const runRound = m.roundTimer.enabled
      if (!runClock && !runRound) return m
      return {
        ...m,
        paused: false,
        activeSince: runClock ? action.now : null,
        roundSince: runRound ? action.now : null,
      }
    }
    case 'TIMEOUT': {
      const settled = settle(m, action.now)
      const stopped = setPlayer(settled, action.player, { clockMs: 0, timedOut: true })
      const wasActive = settled.active === action.player
      return wasActive ? { ...stopped, active: null, activeSince: null } : stopped
    }
    case 'ADJUST_CHAKRA':
      return setPlayer(m, action.player, { chakra: Math.max(0, m.players[action.player].chakra + action.delta) })
    case 'RESET_CHAKRA':
      return setPlayer(m, action.player, { chakra: BASE_CHAKRA })
    case 'ADJUST_MISSION':
      return setPlayer(m, action.player, { mission: Math.max(0, m.players[action.player].mission + action.delta) })
    case 'RESET_MISSION':
      return setPlayer(m, action.player, { mission: 0 })
    case 'SET_EDGE':
      return { ...m, edge: m.edge === action.player ? null : action.player }
    case 'SET_START_TIME': {
      const start = Math.max(MIN_START_MS, action.ms)
      return {
        ...m,
        settings: { startMs: start },
        active: null,
        activeSince: null,
        paused: true,
        players: [
          { ...m.players[0], clockMs: start, timedOut: false },
          { ...m.players[1], clockMs: start, timedOut: false },
        ],
      }
    }
    case 'TOGGLE_ROUND_TIMER': {
      const settled = settle(m, action.now)
      const enabled = !settled.roundTimer.enabled
      return {
        ...settled,
        active: null,
        activeSince: null,
        paused: true,
        roundSince: null,
        roundTimer: { ...settled.roundTimer, enabled, remainingMs: settled.roundTimer.durationMs },
      }
    }
    case 'SET_ROUND_DURATION':
      return { ...m, roundTimer: { ...m.roundTimer, durationMs: action.ms, remainingMs: action.ms }, roundSince: null }
    case 'NEW_MATCH': {
      const seed = createInitialMatch(m.settings.startMs)
      return {
        ...seed,
        roundTimer: { enabled: m.roundTimer.enabled, durationMs: m.roundTimer.durationMs, remainingMs: m.roundTimer.durationMs },
      }
    }
    default:
      return m
  }
}
