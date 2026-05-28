import { describe, it, expect } from 'vitest'
import { createInitialMatch } from './state'
import { MIN_START_MS, BASE_CHAKRA, DEFAULT_ROUND_MS } from './constants'

describe('createInitialMatch', () => {
  it('seeds both players with base chakra, zero mission, full clock', () => {
    const m = createInitialMatch(MIN_START_MS)
    for (const p of m.players) {
      expect(p.chakra).toBe(BASE_CHAKRA)
      expect(p.mission).toBe(0)
      expect(p.clockMs).toBe(MIN_START_MS)
      expect(p.timedOut).toBe(false)
    }
  })
  it('starts paused, idle, no edge', () => {
    const m = createInitialMatch(MIN_START_MS)
    expect(m.paused).toBe(true)
    expect(m.active).toBeNull()
    expect(m.activeSince).toBeNull()
    expect(m.edge).toBeNull()
  })
  it('enforces the 30-minute floor', () => {
    const m = createInitialMatch(60_000)
    expect(m.settings.startMs).toBe(MIN_START_MS)
    expect(m.players[0].clockMs).toBe(MIN_START_MS)
  })
  it('seeds a disabled round timer at default duration', () => {
    const m = createInitialMatch(MIN_START_MS)
    expect(m.roundTimer).toEqual({ enabled: false, durationMs: DEFAULT_ROUND_MS, remainingMs: DEFAULT_ROUND_MS })
    expect(m.roundSince).toBeNull()
  })
})
