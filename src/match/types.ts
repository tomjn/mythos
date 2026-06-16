export type PlayerIndex = 0 | 1

export interface Player {
  name: string
  chakra: number
  mission: number
  /** Remaining clock as of `activeSince` (or absolute when not running). */
  clockMs: number
  timedOut: boolean
}

export interface RoundTimer {
  enabled: boolean
  durationMs: number
  /** Remaining as of `roundSince` (or absolute when not running). */
  remainingMs: number
}

/** Last dice roll: one d20 per side, winner is the higher (null on a tie).
 *  `at` is the roll timestamp — the display fades out 10s later and a roll
 *  older than that (e.g. restored from storage on reload) never shows. */
export interface DiceRoll {
  rolls: [number, number]
  winner: PlayerIndex | null
  at: number
}

export interface Match {
  players: [Player, Player]
  active: PlayerIndex | null
  activeSince: number | null
  edge: PlayerIndex | null
  paused: boolean
  roundTimer: RoundTimer
  roundSince: number | null
  settings: { startMs: number }
  dice: DiceRoll | null
}

export type MatchAction =
  | { type: 'TAP_HALF'; player: PlayerIndex; now: number }
  | { type: 'PAUSE'; now: number }
  | { type: 'RESUME'; now: number }
  | { type: 'TIMEOUT'; player: PlayerIndex; now: number }
  | { type: 'ADJUST_CHAKRA'; player: PlayerIndex; delta: number }
  | { type: 'RESET_CHAKRA'; player: PlayerIndex }
  | { type: 'ADJUST_MISSION'; player: PlayerIndex; delta: number }
  | { type: 'RESET_MISSION'; player: PlayerIndex }
  | { type: 'SET_EDGE'; player: PlayerIndex }
  | { type: 'SET_START_TIME'; ms: number }
  | { type: 'TOGGLE_ROUND_TIMER'; now: number }
  | { type: 'SET_ROUND_DURATION'; ms: number }
  | { type: 'ROLL_DICE'; rolls: [number, number]; now: number }
  | { type: 'NEW_MATCH' }
