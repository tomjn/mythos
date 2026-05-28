import type { Match } from './types'
import { STORAGE_KEY } from './constants'

export function saveMatch(m: Match): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(m))
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
