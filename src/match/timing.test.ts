import { describe, it, expect } from 'vitest'
import { liveClockMs, liveRoundMs } from './timing'
import { createInitialMatch } from './state'
import { MIN_START_MS } from './constants'

describe('liveClockMs', () => {
  it('deducts elapsed from the active running player', () => {
    const base = createInitialMatch(MIN_START_MS)
    const m = { ...base, active: 0 as const, activeSince: 1000, paused: false }
    expect(liveClockMs(m, 0, 6000)).toBe(MIN_START_MS - 5000)
  })
  it('does not deduct from the inactive player', () => {
    const base = createInitialMatch(MIN_START_MS)
    const m = { ...base, active: 0 as const, activeSince: 1000, paused: false }
    expect(liveClockMs(m, 1, 6000)).toBe(MIN_START_MS)
  })
  it('does not deduct while paused', () => {
    const base = createInitialMatch(MIN_START_MS)
    const m = { ...base, active: 0 as const, activeSince: 1000, paused: true }
    expect(liveClockMs(m, 0, 6000)).toBe(MIN_START_MS)
  })
  it('clamps to zero', () => {
    const base = createInitialMatch(MIN_START_MS)
    const m = { ...base, active: 0 as const, activeSince: 0, paused: false }
    expect(liveClockMs(m, 0, MIN_START_MS + 10_000)).toBe(0)
  })
})

describe('liveRoundMs', () => {
  it('deducts elapsed when enabled and running', () => {
    const base = createInitialMatch(MIN_START_MS)
    const m = { ...base, paused: false, roundSince: 1000, roundTimer: { ...base.roundTimer, enabled: true } }
    expect(liveRoundMs(m, 4000)).toBe(base.roundTimer.durationMs - 3000)
  })
  it('returns stored remaining when disabled', () => {
    const base = createInitialMatch(MIN_START_MS)
    expect(liveRoundMs(base, 9_999_999)).toBe(base.roundTimer.durationMs)
  })
})
