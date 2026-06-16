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
  it('returns null on corrupt data', () => {
    localStorage.setItem(STORAGE_KEY, '{not json')
    expect(loadMatch()).toBeNull()
  })
  it('returns null when shape is invalid', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ foo: 1 }))
    expect(loadMatch()).toBeNull()
  })
})
