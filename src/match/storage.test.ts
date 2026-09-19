import { describe, it, expect, beforeEach } from 'vitest'
import { loadMatch, saveMatch } from './storage'
import { createInitialMatch } from './state'
import { MIN_START_MS, STORAGE_KEY } from './constants'

beforeEach(() => localStorage.clear())

describe('storage', () => {
  it('returns null when nothing is stored', () => {
    expect(loadMatch()).toBeNull()
  })
  it('round-trips a match', () => {
    const m = createInitialMatch(MIN_START_MS)
    saveMatch(m)
    expect(loadMatch()).toEqual(m)
  })
  it('does not persist the ephemeral dice roll across a reload', () => {
    const m = { ...createInitialMatch(MIN_START_MS), dice: { rolls: [7, 14] as [number, number], winner: 1 as const, at: 123 } }
    saveMatch(m)
    expect(loadMatch()?.dice).toBeNull()
  })
  it('upgrades a match saved before per-player start times and the log', () => {
    const old = { ...createInitialMatch(MIN_START_MS), log: undefined, settings: { startMs: 1_800_000 } }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(old))
    const m = loadMatch()
    expect(m?.settings.startMs).toEqual([1_800_000, 1_800_000])
    expect(m?.log).toEqual([])
  })
  it('returns null when the start times are malformed', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...createInitialMatch(), settings: { startMs: ['a', 1] } }))
    expect(loadMatch()).toBeNull()
  })
  it('returns null on corrupt data', () => {
    localStorage.setItem(STORAGE_KEY, '{not json')
    expect(loadMatch()).toBeNull()
  })
  it('returns null when shape is invalid', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ foo: 1 }))
    expect(loadMatch()).toBeNull()
  })
})
