import type { Match, Player } from './types'
import { MIN_START_MS, BASE_CHAKRA, DEFAULT_ROUND_MS } from './constants'

export function createInitialMatch(startMs: number = MIN_START_MS): Match {
  const start = Math.max(MIN_START_MS, startMs)
  const player = (name: string): Player => ({
    name,
    chakra: BASE_CHAKRA,
    mission: 0,
    clockMs: start,
    timedOut: false,
  })
  return {
    players: [player('Player 1'), player('Player 2')],
    active: null,
    activeSince: null,
    edge: null,
    paused: true,
    roundTimer: { enabled: false, durationMs: DEFAULT_ROUND_MS, remainingMs: DEFAULT_ROUND_MS },
    roundSince: null,
    settings: { startMs: start },
    dice: null,
  }
}
