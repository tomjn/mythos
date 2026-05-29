export const MIN_START_MS = 15 * 60 * 1000 // 15-minute per-player floor (about 30 min total for two players)
export const BASE_CHAKRA = 5 // game base chakra; chakra reset returns here
export const DEFAULT_ROUND_MS = 25 * 60 * 1000 // default shared round-timer duration
export const STORAGE_KEY = 'mythos-match-v1'
export const TICK_MS = 250 // render cadence for live timers
export const WARN_MS = 2 * 60 * 1000 // clock turns amber at/under 2 minutes
export const DANGER_MS = 30 * 1000 // clock turns red and pulses at/under 30 seconds
