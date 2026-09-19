import { describe, it, expect } from 'vitest'
import { matchReducer } from './reducer'
import { createInitialMatch } from './state'
import { liveClockMs, liveRoundMs } from './timing'
import { MIN_START_MS, BASE_CHAKRA, DELTA_WINDOW_MS } from './constants'
import { formatLogEntry } from './format'

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
    let m = matchReducer(fresh(), { type: 'ADJUST_CHAKRA', player: 0, delta: -10, now: 0 })
    expect(m.players[0].chakra).toBe(0)
    m = matchReducer(m, { type: 'ADJUST_CHAKRA', player: 0, delta: 5, now: 0 })
    expect(m.players[0].chakra).toBe(5)
  })
  it('ADJUST_CHAKRA by 5 adds five and logs it', () => {
    const m = matchReducer(fresh(), { type: 'ADJUST_CHAKRA', player: 0, delta: 5, now: 0 })
    expect(m.players[0].chakra).toBe(BASE_CHAKRA + 5)
    expect(formatLogEntry(m.log[0], m.players)).toBe('Player 1 added 5 chakra (5 to 10)')
  })
  it('ADJUST_MISSION clamps at zero', () => {
    const m = matchReducer(fresh(), { type: 'ADJUST_MISSION', player: 1, delta: -3, now: 0 })
    expect(m.players[1].mission).toBe(0)
  })
  it('RESET_MISSION returns mission to zero', () => {
    let m = matchReducer(fresh(), { type: 'ADJUST_MISSION', player: 0, delta: 7, now: 0 })
    m = matchReducer(m, { type: 'RESET_MISSION', player: 0, now: 0 })
    expect(m.players[0].mission).toBe(0)
  })
  it('SET_EDGE is exclusive and toggles off the current holder', () => {
    let m = matchReducer(fresh(), { type: 'SET_EDGE', player: 0, now: 0 })
    expect(m.edge).toBe(0)
    m = matchReducer(m, { type: 'SET_EDGE', player: 1, now: 0 })
    expect(m.edge).toBe(1)
    m = matchReducer(m, { type: 'SET_EDGE', player: 1, now: 0 })
    expect(m.edge).toBeNull()
  })
  it('SET_START_TIME enforces the floor per player and resets both clocks', () => {
    let m = matchReducer(fresh(), { type: 'TAP_HALF', player: 0, now: 0 })
    m = matchReducer(m, { type: 'SET_START_TIME', ms: [10_000, 11 * 60_000], now: 0 })
    expect(m.settings.startMs).toEqual([MIN_START_MS, 11 * 60_000])
    expect(m.players[0].clockMs).toBe(MIN_START_MS)
    expect(m.players[1].clockMs).toBe(11 * 60_000)
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
    const m = matchReducer(fresh(), { type: 'SET_ROUND_DURATION', ms: 12_345, now: 0 })
    expect(m.roundTimer.durationMs).toBe(12_345)
    expect(m.roundTimer.remainingMs).toBe(12_345)
    expect(m.roundSince).toBeNull()
  })
  it('NEW_MATCH resets play state but keeps start time and round-timer config', () => {
    let m = matchReducer(fresh(), { type: 'SET_ROUND_DURATION', ms: 12_345, now: 0 })
    m = matchReducer(m, { type: 'TOGGLE_ROUND_TIMER', now: 0 })
    m = matchReducer(m, { type: 'ADJUST_MISSION', player: 0, delta: 7, now: 0 })
    m = matchReducer(m, { type: 'NEW_MATCH' })
    expect(m.players[0].mission).toBe(0)
    expect(m.roundTimer.durationMs).toBe(12_345)
    expect(m.roundTimer.enabled).toBe(true)
    expect(m.roundTimer.remainingMs).toBe(12_345)
  })
})

describe('reducer dice roll', () => {
  it('ROLL_DICE stores both rolls, the roll time, and flags the higher as winner', () => {
    const m = matchReducer(fresh(), { type: 'ROLL_DICE', rolls: [7, 14], now: 1000 })
    expect(m.dice).toEqual({ rolls: [7, 14], winner: 1, at: 1000 })
  })
  it('the higher roll wins regardless of side', () => {
    const m = matchReducer(fresh(), { type: 'ROLL_DICE', rolls: [20, 3], now: 1000 })
    expect(m.dice).toEqual({ rolls: [20, 3], winner: 0, at: 1000 })
  })
  it('equal rolls are a tie with no winner', () => {
    const m = matchReducer(fresh(), { type: 'ROLL_DICE', rolls: [11, 11], now: 1000 })
    expect(m.dice).toEqual({ rolls: [11, 11], winner: null, at: 1000 })
  })
  it('NEW_MATCH keeps a docked per-player start time', () => {
    let m = matchReducer(fresh(), { type: 'SET_START_TIME', ms: [15 * 60_000, 11 * 60_000], now: 0 })
    m = matchReducer(m, { type: 'NEW_MATCH' })
    expect(m.players[0].clockMs).toBe(15 * 60_000)
    expect(m.players[1].clockMs).toBe(11 * 60_000)
  })
  it('NEW_MATCH clears any prior dice roll', () => {
    let m = matchReducer(fresh(), { type: 'ROLL_DICE', rolls: [5, 9], now: 1000 })
    m = matchReducer(m, { type: 'NEW_MATCH' })
    expect(m.dice).toBeNull()
  })
})

describe('reducer match log', () => {
  const texts = (m: ReturnType<typeof fresh>) => m.log.map((e) => formatLogEntry(e, m.players))

  it('starts empty and NEW_MATCH clears it', () => {
    let m = fresh()
    expect(m.log).toEqual([])
    m = matchReducer(m, { type: 'SET_EDGE', player: 0, now: 0 })
    expect(m.log).toHaveLength(1)
    expect(matchReducer(m, { type: 'NEW_MATCH' }).log).toEqual([])
  })
  it('merges taps on the same counter while they keep coming inside the window', () => {
    let m = fresh()
    m = matchReducer(m, { type: 'ADJUST_CHAKRA', player: 0, delta: 1, now: 0 })
    m = matchReducer(m, { type: 'ADJUST_CHAKRA', player: 0, delta: 1, now: DELTA_WINDOW_MS - 1 })
    // Measured from the previous tap, not the first one.
    m = matchReducer(m, { type: 'ADJUST_CHAKRA', player: 0, delta: 1, now: 2 * DELTA_WINDOW_MS - 2 })
    expect(texts(m)).toEqual(['Player 1 added 3 chakra (5 to 8)'])
  })
  it('starts a new entry after the window, for another player, or another counter', () => {
    let m = fresh()
    m = matchReducer(m, { type: 'ADJUST_CHAKRA', player: 0, delta: 1, now: 0 })
    m = matchReducer(m, { type: 'ADJUST_CHAKRA', player: 0, delta: -1, now: DELTA_WINDOW_MS })
    m = matchReducer(m, { type: 'ADJUST_CHAKRA', player: 1, delta: 5, now: DELTA_WINDOW_MS })
    m = matchReducer(m, { type: 'ADJUST_MISSION', player: 1, delta: 1, now: DELTA_WINDOW_MS })
    expect(texts(m)).toEqual([
      'Player 1 added 1 chakra (5 to 6)',
      'Player 1 removed 1 chakra (6 to 5)',
      'Player 2 added 5 chakra (5 to 10)',
      'Player 2 added 1 mission (0 to 1)',
    ])
  })
  it('drops a merged entry that nets out to no change, and ignores clamped no-ops', () => {
    let m = fresh()
    m = matchReducer(m, { type: 'ADJUST_CHAKRA', player: 0, delta: 1, now: 0 })
    m = matchReducer(m, { type: 'ADJUST_CHAKRA', player: 0, delta: -1, now: 100 })
    m = matchReducer(m, { type: 'ADJUST_MISSION', player: 0, delta: -1, now: 200 })
    expect(m.log).toEqual([])
  })
  it('says when opening the match log is what paused the game', () => {
    let m = matchReducer(fresh(), { type: 'TAP_HALF', player: 0, now: 1 })
    m = matchReducer(m, { type: 'PAUSE', now: 2, byLog: true })
    m = matchReducer(m, { type: 'PAUSE', now: 3, byLog: true }) // already paused: nothing to report
    expect(texts(m)).toEqual(["Player 1's clock started", 'Match log opened, which paused the game'])
  })
  it('logs turns, pause, resume, edge, dice, timeout and settings changes', () => {
    let m = fresh()
    m = matchReducer(m, { type: 'ROLL_DICE', rolls: [7, 14], now: 0 })
    m = matchReducer(m, { type: 'TAP_HALF', player: 0, now: 1 })
    m = matchReducer(m, { type: 'TAP_HALF', player: 0, now: 2 })
    m = matchReducer(m, { type: 'PAUSE', now: 3 })
    m = matchReducer(m, { type: 'PAUSE', now: 4 }) // already paused: no second entry
    m = matchReducer(m, { type: 'RESUME', now: 5 })
    m = matchReducer(m, { type: 'SET_EDGE', player: 1, now: 6 })
    m = matchReducer(m, { type: 'SET_EDGE', player: 1, now: 7 })
    m = matchReducer(m, { type: 'TIMEOUT', player: 1, now: 8 })
    m = matchReducer(m, { type: 'SET_START_TIME', ms: [15 * 60_000, 11 * 60_000], now: 9 })
    m = matchReducer(m, { type: 'SET_ROUND_DURATION', ms: 20 * 60_000, now: 10 })
    m = matchReducer(m, { type: 'TOGGLE_ROUND_TIMER', now: 11 })
    expect(texts(m)).toEqual([
      'Dice: Player 1 rolled 7, Player 2 rolled 14',
      "Player 1's clock started",
      'Turn passed to Player 2',
      'Paused',
      'Resumed',
      'Player 2 took the edge',
      'Player 2 gave up the edge',
      'Player 2 ran out of time',
      'Clocks set to 15 and 11 minutes',
      'Round length set to 20 minutes',
      'Shared round timer turned on',
    ])
    expect(m.log.map((e) => e.at)).toEqual([0, 1, 2, 3, 5, 6, 7, 8, 9, 10, 11])
  })
})
