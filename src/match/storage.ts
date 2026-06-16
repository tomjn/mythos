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
      parsed.players.length === 2 &&
      typeof parsed.settings?.startMs === 'number'
    ) {
      return parsed as Match
    }
    return null
  } catch {
    return null
  }
}
