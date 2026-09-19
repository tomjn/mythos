import type { Match, Player } from './types'
import { MIN_START_MS, DEFAULT_START_MS, BASE_CHAKRA, DEFAULT_ROUND_MS } from './constants'

export function createInitialMatch(startMs: number | [number, number] = DEFAULT_START_MS): Match {
  const [a, b] = typeof startMs === 'number' ? [startMs, startMs] : startMs
  const start: [number, number] = [Math.max(MIN_START_MS, a), Math.max(MIN_START_MS, b)]
  const player = (name: string, clockMs: number): Player => ({
    name,
    chakra: BASE_CHAKRA,
    mission: 0,
    clockMs,
    timedOut: false,
  })
  return {
    players: [player('Player 1', start[0]), player('Player 2', start[1])],
    active: null,
    activeSince: null,
    edge: null,
    paused: true,
    roundTimer: { enabled: false, durationMs: DEFAULT_ROUND_MS, remainingMs: DEFAULT_ROUND_MS },
    roundSince: null,
    settings: { startMs: start },
    dice: null,
    log: [],
  }
}
