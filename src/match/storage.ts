import type { Match } from './types'
import { STORAGE_KEY } from './constants'

export function saveMatch(m: Match): void {
  try {
    // The dice roll is ephemeral table-talk, not match state — never restore it
    // on reload, so a refresh always clears it.
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...m, dice: null }))
  } catch {
    // storage unavailable / quota — non-fatal
  }
}

export function loadMatch(): Match | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (
      parsed &&
      Array.isArray(parsed.players) &&
      parsed.players.length === 2
    ) {
      // Matches saved before per-player start times hold a single number, and
      // ones saved before the log have no log.
      const startMs = parsed.settings?.startMs
      const pair = typeof startMs === 'number' ? [startMs, startMs] : startMs
      if (!Array.isArray(pair) || pair.length !== 2 || !pair.every((n) => typeof n === 'number')) return null
      return { ...parsed, settings: { startMs: pair }, log: Array.isArray(parsed.log) ? parsed.log : [] } as Match
    }
    return null
  } catch {
    return null
  }
}
