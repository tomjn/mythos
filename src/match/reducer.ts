import type { Match, MatchAction, Player, PlayerIndex } from './types'
import { createInitialMatch } from './state'
import { DELTA_WINDOW_MS, MIN_START_MS } from './constants'
import { formatMinutes } from './format'

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

function logEvent(m: Match, at: number, text: string): Match {
  return { ...m, log: [...m.log, { at, kind: 'event', text }] }
}

// Sets a counter and logs it. Taps on the same counter that keep arriving within
// DELTA_WINDOW_MS of each other merge into one entry; one that nets out to no
// change (a corrected mis-tap) drops out of the log.
function setStat(m: Match, index: PlayerIndex, stat: 'chakra' | 'mission', to: number, now: number): Match {
  const from = m.players[index][stat]
  if (from === to) return m
  const last = m.log[m.log.length - 1]
  const merges = last?.kind === 'stat' && last.player === index && last.stat === stat && now - last.at < DELTA_WINDOW_MS
  const start = merges ? last.from : from
  const rest = merges ? m.log.slice(0, -1) : m.log
  const log = start === to ? rest : [...rest, { at: now, kind: 'stat' as const, player: index, stat, from: start, to }]
  return { ...setPlayer(m, index, { [stat]: to }), log }
}

export function matchReducer(m: Match, action: MatchAction): Match {
  switch (action.type) {
    case 'TAP_HALF': {
      const settled = settle(m, action.now)
      // First tap of a match (nothing running yet) starts the tapped player's
      // own clock; once a clock is running, tapping a side ends that turn and
      // hands the clock to the opponent.
      const next: PlayerIndex = settled.active == null ? action.player : action.player === 0 ? 1 : 0
      const text = settled.active == null ? `${m.players[next].name}'s clock started` : `Turn passed to ${m.players[next].name}`
      return { ...logEvent(settled, action.now, text), paused: false, active: next, activeSince: action.now,
        roundSince: settled.roundTimer.enabled ? action.now : null }
    }
    case 'PAUSE': {
      if (m.paused) return m
      const settled = logEvent(settle(m, action.now), action.now, action.byLog ? 'Match log opened, which paused the game' : 'Paused')
      return { ...settled, paused: true, activeSince: null, roundSince: null }
    }
    case 'RESUME': {
      const runClock = m.active != null
      const runRound = m.roundTimer.enabled
      if (!runClock && !runRound) return m
      return {
        ...logEvent(m, action.now, 'Resumed'),
        paused: false,
        activeSince: runClock ? action.now : null,
        roundSince: runRound ? action.now : null,
      }
    }
    case 'TIMEOUT': {
      const settled = settle(m, action.now)
      const stopped = logEvent(
        setPlayer(settled, action.player, { clockMs: 0, timedOut: true }),
        action.now,
        `${m.players[action.player].name} ran out of time`,
      )
      const wasActive = settled.active === action.player
      return wasActive ? { ...stopped, active: null, activeSince: null } : stopped
    }
    case 'ADJUST_CHAKRA':
      return setStat(m, action.player, 'chakra', Math.max(0, m.players[action.player].chakra + action.delta), action.now)
    case 'ADJUST_MISSION':
      return setStat(m, action.player, 'mission', Math.max(0, m.players[action.player].mission + action.delta), action.now)
    case 'RESET_MISSION':
      return setStat(m, action.player, 'mission', 0, action.now)
    case 'SET_EDGE': {
      const edge = m.edge === action.player ? null : action.player
      const name = m.players[action.player].name
      return { ...logEvent(m, action.now, edge == null ? `${name} gave up the edge` : `${name} took the edge`), edge }
    }
    case 'SET_START_TIME': {
      const start: [number, number] = [Math.max(MIN_START_MS, action.ms[0]), Math.max(MIN_START_MS, action.ms[1])]
      const text = `Clocks set to ${formatMinutes(start[0])} and ${formatMinutes(start[1])} minutes`
      return {
        ...logEvent(m, action.now, text),
        settings: { startMs: start },
        active: null,
        activeSince: null,
        paused: true,
        players: [
          { ...m.players[0], clockMs: start[0], timedOut: false },
          { ...m.players[1], clockMs: start[1], timedOut: false },
        ],
      }
    }
    case 'TOGGLE_ROUND_TIMER': {
      const settled = settle(m, action.now)
      const enabled = !settled.roundTimer.enabled
      return {
        ...logEvent(settled, action.now, enabled ? 'Shared round timer turned on' : 'Shared round timer turned off'),
        active: null,
        activeSince: null,
        paused: true,
        roundSince: null,
        roundTimer: { ...settled.roundTimer, enabled, remainingMs: settled.roundTimer.durationMs },
      }
    }
    case 'SET_ROUND_DURATION':
      return {
        ...logEvent(m, action.now, `Round length set to ${formatMinutes(action.ms)} minutes`),
        roundTimer: { ...m.roundTimer, durationMs: action.ms, remainingMs: action.ms },
        roundSince: null,
      }
    case 'ROLL_DICE': {
      const [a, b] = action.rolls
      const winner: PlayerIndex | null = a === b ? null : a > b ? 0 : 1
      const text = `Dice: ${m.players[0].name} rolled ${a}, ${m.players[1].name} rolled ${b}`
      return { ...logEvent(m, action.now, text), dice: { rolls: action.rolls, winner, at: action.now } }
    }
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
