import { describe, it, expect } from 'vitest'
import { matchReducer } from './reducer'
import { createInitialMatch } from './state'
import { liveClockMs } from './timing'
import { MIN_START_MS } from './constants'

const fresh = () => createInitialMatch(MIN_START_MS)

describe('reducer clock actions', () => {
  it('TAP_HALF starts the OTHER player and runs the clock', () => {
    const m = matchReducer(fresh(), { type: 'TAP_HALF', player: 0, now: 1000 })
    expect(m.active).toBe(1)
    expect(m.paused).toBe(false)
    expect(m.activeSince).toBe(1000)
  })

  it('tapping the active player again folds elapsed and passes back', () => {
    let m = matchReducer(fresh(), { type: 'TAP_HALF', player: 0, now: 0 }) // P1 active
    m = matchReducer(m, { type: 'TAP_HALF', player: 1, now: 5000 }) // P1 taps -> P0 active
    expect(m.active).toBe(0)
    expect(m.players[1].clockMs).toBe(MIN_START_MS - 5000) // P1's spent time folded
    expect(m.activeSince).toBe(5000)
  })

  it('PAUSE folds elapsed and stops; RESUME continues the same player', () => {
    let m = matchReducer(fresh(), { type: 'TAP_HALF', player: 1, now: 0 }) // P0 active
    m = matchReducer(m, { type: 'PAUSE', now: 4000 })
    expect(m.paused).toBe(true)
    expect(m.activeSince).toBeNull()
    expect(m.players[0].clockMs).toBe(MIN_START_MS - 4000)
    m = matchReducer(m, { type: 'RESUME', now: 10_000 })
    expect(m.paused).toBe(false)
    expect(m.active).toBe(0)
    expect(liveClockMs(m, 0, 11_000)).toBe(MIN_START_MS - 5000)
  })

  it('TIMEOUT clamps the player to zero, flags them, stops their clock', () => {
    let m = matchReducer(fresh(), { type: 'TAP_HALF', player: 1, now: 0 }) // P0 active
    m = matchReducer(m, { type: 'TIMEOUT', player: 0, now: MIN_START_MS + 1000 })
    expect(m.players[0].clockMs).toBe(0)
    expect(m.players[0].timedOut).toBe(true)
    expect(m.active).toBeNull()
  })
})
