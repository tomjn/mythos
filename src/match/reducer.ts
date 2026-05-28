import type { Match, MatchAction, Player, PlayerIndex } from './types'

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
      if (m.active == null) return m
      return { ...m, paused: false, activeSince: action.now,
        roundSince: m.roundTimer.enabled ? action.now : null }
    }
    case 'TIMEOUT': {
      const settled = settle(m, action.now)
      const stopped = setPlayer(settled, action.player, { clockMs: 0, timedOut: true })
      const wasActive = settled.active === action.player
      return wasActive ? { ...stopped, active: null, activeSince: null } : stopped
    }
    default:
      return m
  }
}
