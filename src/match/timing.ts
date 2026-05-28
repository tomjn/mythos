import type { Match, PlayerIndex } from './types'

export function liveClockMs(m: Match, index: PlayerIndex, now: number): number {
  const stored = m.players[index].clockMs
  if (m.active === index && !m.paused && m.activeSince != null) {
    return Math.max(0, stored - (now - m.activeSince))
  }
  return Math.max(0, stored)
}

export function liveRoundMs(m: Match, now: number): number {
  const { enabled, remainingMs } = m.roundTimer
  if (enabled && !m.paused && m.roundSince != null) {
    return Math.max(0, remainingMs - (now - m.roundSince))
  }
  return Math.max(0, remainingMs)
}
