import { describe, it, expect } from 'vitest'
import { matchReducer } from './reducer'
import { createInitialMatch } from './state'
import { liveClockMs, liveRoundMs } from './timing'
import { MIN_START_MS, BASE_CHAKRA } from './constants'

const fresh = () => createInitialMatch(MIN_START_MS)

describe('reducer clock actions', () => {
  it('the first tap starts the tapped player and runs the clock', () => {
    const m = matchReducer(fresh(), { type: 'TAP_HALF', player: 0, now: 1000 })
    expect(m.active).toBe(0)
    expect(m.paused).toBe(false)
    expect(m.activeSince).toBe(1000)
  })

  it('once running, tapping a side folds elapsed and passes to the opponent', () => {
    let m = matchReducer(fresh(), { type: 'TAP_HALF', player: 0, now: 0 }) // P1 (index 0) starts
    expect(m.active).toBe(0)
    m = matchReducer(m, { type: 'TAP_HALF', player: 0, now: 5000 }) // P1 ends turn -> P2
    expect(m.active).toBe(1)
    expect(m.players[0].clockMs).toBe(MIN_START_MS - 5000) // P1's spent time folded
    expect(m.activeSince).toBe(5000)
  })

  it('PAUSE folds elapsed and stops; RESUME continues the same player', () => {
    let m = matchReducer(fresh(), { type: 'TAP_HALF', player: 0, now: 0 }) // P1 (index 0) starts
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
    let m = matchReducer(fresh(), { type: 'TAP_HALF', player: 0, now: 0 }) // P1 (index 0) running
    m = matchReducer(m, { type: 'TIMEOUT', player: 0, now: MIN_START_MS + 1000 })
    expect(m.players[0].clockMs).toBe(0)
    expect(m.players[0].timedOut).toBe(true)
    expect(m.active).toBeNull()
  })
})

describe('reducer counters & toggles', () => {
  it('ADJUST_CHAKRA clamps at zero', () => {
    let m = matchReducer(fresh(), { type: 'ADJUST_CHAKRA', player: 0, delta: -10 })
    expect(m.players[0].chakra).toBe(0)
    m = matchReducer(m, { type: 'ADJUST_CHAKRA', player: 0, delta: 5 })
    expect(m.players[0].chakra).toBe(5)
  })
  it('RESET_CHAKRA returns to base 5', () => {
    let m = matchReducer(fresh(), { type: 'ADJUST_CHAKRA', player: 0, delta: 9 })
    m = matchReducer(m, { type: 'RESET_CHAKRA', player: 0 })
    expect(m.players[0].chakra).toBe(BASE_CHAKRA)
  })
  it('ADJUST_MISSION clamps at zero', () => {
    const m = matchReducer(fresh(), { type: 'ADJUST_MISSION', player: 1, delta: -3 })
    expect(m.players[1].mission).toBe(0)
  })
  it('RESET_MISSION returns mission to zero', () => {
    let m = matchReducer(fresh(), { type: 'ADJUST_MISSION', player: 0, delta: 7 })
    m = matchReducer(m, { type: 'RESET_MISSION', player: 0 })
    expect(m.players[0].mission).toBe(0)
  })
  it('SET_EDGE is exclusive and toggles off the current holder', () => {
    let m = matchReducer(fresh(), { type: 'SET_EDGE', player: 0 })
    expect(m.edge).toBe(0)
    m = matchReducer(m, { type: 'SET_EDGE', player: 1 })
    expect(m.edge).toBe(1)
    m = matchReducer(m, { type: 'SET_EDGE', player: 1 })
    expect(m.edge).toBeNull()
  })
  it('SET_START_TIME enforces floor and resets both clocks', () => {
    let m = matchReducer(fresh(), { type: 'TAP_HALF', player: 0, now: 0 })
    m = matchReducer(m, { type: 'SET_START_TIME', ms: 10_000 })
    expect(m.settings.startMs).toBe(MIN_START_MS)
    expect(m.players[0].clockMs).toBe(MIN_START_MS)
    expect(m.players[1].clockMs).toBe(MIN_START_MS)
    expect(m.active).toBeNull()
    expect(m.paused).toBe(true)
  })
  it('TOGGLE_ROUND_TIMER flips enabled', () => {
    const m = matchReducer(fresh(), { type: 'TOGGLE_ROUND_TIMER', now: 0 })
    expect(m.roundTimer.enabled).toBe(true)
  })
  it('RESUME starts the shared round timer in round mode (no active player)', () => {
    let m = matchReducer(fresh(), { type: 'TOGGLE_ROUND_TIMER', now: 0 })
    expect(m.roundTimer.enabled).toBe(true)
    expect(m.active).toBeNull()
    expect(m.paused).toBe(true)
    m = matchReducer(m, { type: 'RESUME', now: 1000 })
    expect(m.paused).toBe(false)
    expect(m.roundSince).toBe(1000)
    expect(liveRoundMs(m, 4000)).toBe(m.roundTimer.durationMs - 3000)
  })
  it('SET_ROUND_DURATION resets duration and remaining', () => {
    const m = matchReducer(fresh(), { type: 'SET_ROUND_DURATION', ms: 12_345 })
    expect(m.roundTimer.durationMs).toBe(12_345)
    expect(m.roundTimer.remainingMs).toBe(12_345)
    expect(m.roundSince).toBeNull()
  })
  it('NEW_MATCH resets play state but keeps start time and round-timer config', () => {
    let m = matchReducer(fresh(), { type: 'SET_ROUND_DURATION', ms: 12_345 })
    m = matchReducer(m, { type: 'TOGGLE_ROUND_TIMER', now: 0 })
    m = matchReducer(m, { type: 'ADJUST_MISSION', player: 0, delta: 7 })
    m = matchReducer(m, { type: 'NEW_MATCH' })
    expect(m.players[0].mission).toBe(0)
    expect(m.roundTimer.durationMs).toBe(12_345)
    expect(m.roundTimer.enabled).toBe(true)
    expect(m.roundTimer.remainingMs).toBe(12_345)
  })
})
