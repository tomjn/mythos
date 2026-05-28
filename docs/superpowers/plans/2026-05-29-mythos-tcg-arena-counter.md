# Mythos TCG Arena Counter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a client-only PWA reproducing the iOS "Mythos TCG Arena Timer" — a split-screen tabletop counter with per-player chess clocks, a concurrent shared round timer, Chakra and Mission counters, and an exclusive Edge toggle.

**Architecture:** Single React SPA. One `Match` state object lives in a `useReducer` exposed via Context. Timers are **timestamp-derived** (stored values change only on discrete events; live display is computed from `Date.now()`), which stays accurate under mobile background throttling and reconstructs exactly after a refresh. State persists to `localStorage`. One match screen (split vertically, Player 2's half rotated 180°) plus a settings screen, routed with HashRouter.

**Tech Stack:** Vite, React, TypeScript, Tailwind CSS v3, shadcn/ui, react-router-dom (HashRouter), lucide-react, Vitest + React Testing Library.

---

## File Structure

```
index.html
public/manifest.webmanifest
public/icon-192.png, icon-512.png        # placeholder icons
src/
  main.tsx                 # entry, mounts <App/>
  App.tsx                  # HashRouter + routes + MatchProvider
  index.css                # tailwind layers + per-player theme tokens
  lib/utils.ts             # cn() (shadcn)
  components/ui/*          # shadcn-generated primitives
  match/
    constants.ts           # MIN_START_MS, BASE_CHAKRA, DEFAULT_ROUND_MS, STORAGE_KEY
    types.ts               # Match, Player, actions
    format.ts              # formatMs(ms) -> "MM:SS"
    state.ts               # createInitialMatch()
    timing.ts              # liveClockMs(), liveRoundMs() (pure, take `now`)
    reducer.ts             # matchReducer
    storage.ts             # loadMatch(), saveMatch()
    MatchContext.tsx       # MatchProvider, useMatch(), useNow()
  hooks/useWakeLock.ts     # Screen Wake Lock
  components/
    ClockDisplay.tsx
    StatTile.tsx
    EdgePill.tsx
    PlayerPanel.tsx
    CenterBand.tsx
  screens/
    MatchScreen.tsx
    SettingsScreen.tsx
```

Each `match/*` file has one responsibility; pure logic (`format`, `state`, `timing`, `reducer`, `storage`) is fully unit-tested without the DOM.

---

## Task 1: Project scaffold

**Files:**
- Create: whole Vite project, `vite.config.ts`, `tailwind.config.js`, `postcss.config.js`, `src/index.css`, `tsconfig*.json`, `components.json`, `src/lib/utils.ts`, shadcn `components/ui/*`.

- [ ] **Step 1: Scaffold Vite React-TS in place**

The folder already contains `docs/` and `.git`. Scaffold into the current directory:

```bash
npm create vite@latest . -- --template react-ts
npm install
```

If prompted that the directory is not empty, choose "Ignore files and continue".

- [ ] **Step 2: Install dependencies**

```bash
npm install react-router-dom lucide-react
npm install -D tailwindcss@3 postcss autoprefixer vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event @types/node
npx tailwindcss init -p
```

- [ ] **Step 3: Configure path alias** — replace `vite.config.ts` with:

```ts
/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
  base: './',
  plugins: [react()],
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test-setup.ts',
  },
})
```

`base: './'` makes the built bundle work from any sub-path on the owner's site.

- [ ] **Step 4: Add the `@` alias to `tsconfig.app.json`** — inside `compilerOptions` add:

```json
"baseUrl": ".",
"paths": { "@/*": ["./src/*"] }
```

- [ ] **Step 5: Create `src/test-setup.ts`**

```ts
import '@testing-library/jest-dom/vitest'
```

- [ ] **Step 6: Configure Tailwind** — replace `tailwind.config.js`:

```js
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: { extend: {} },
  plugins: [],
}
```

- [ ] **Step 7: Replace `src/index.css`** with Tailwind layers + theme tokens:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root { color-scheme: dark; }
html, body, #root { height: 100%; margin: 0; }
body { overscroll-behavior: none; -webkit-user-select: none; user-select: none; }

/* Per-player theme tokens (consumed via inline style or data attributes) */
.theme-p1 { --bg: #5b1418; --surface: #7a1c22; --accent: #f59e42; --accent-fg: #3a0c0e; }
.theme-p2 { --bg: #16306b; --surface: #1e3f86; --accent: #7fd4f5; --accent-fg: #0a1f44; }
```

- [ ] **Step 8: Init shadcn and add primitives**

```bash
npx shadcn@latest init -d
npx shadcn@latest add button dialog switch slider input label
```

Accept defaults (style: default, base color: slate, CSS variables: yes). This creates `src/lib/utils.ts`, `components.json`, and `src/components/ui/*`.

- [ ] **Step 9: Add test scripts to `package.json`**

```json
"scripts": {
  "dev": "vite",
  "build": "tsc -b && vite build",
  "preview": "vite preview",
  "test": "vitest run",
  "test:watch": "vitest"
}
```

- [ ] **Step 10: Smoke test** — create `src/smoke.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
describe('toolchain', () => {
  it('runs', () => { expect(1 + 1).toBe(2) })
})
```

Run: `npm test`
Expected: PASS (1 test).

- [ ] **Step 11: Verify build**

Run: `npm run build`
Expected: build completes, `dist/` produced.

- [ ] **Step 12: Commit**

```bash
git add -A
git commit -m "Scaffold Vite React-TS project with Tailwind, shadcn, Vitest"
```

---

## Task 2: Constants and types

**Files:**
- Create: `src/match/constants.ts`, `src/match/types.ts`

- [ ] **Step 1: Create `src/match/constants.ts`**

```ts
export const MIN_START_MS = 30 * 60 * 1000 // 30-minute floor for player clocks
export const BASE_CHAKRA = 5 // game base chakra; chakra reset returns here
export const DEFAULT_ROUND_MS = 25 * 60 * 1000 // default shared round-timer duration
export const STORAGE_KEY = 'mythos-match-v1'
export const TICK_MS = 250 // render cadence for live timers
```

- [ ] **Step 2: Create `src/match/types.ts`**

```ts
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

export interface Match {
  players: [Player, Player]
  active: PlayerIndex | null
  activeSince: number | null
  edge: PlayerIndex | null
  paused: boolean
  roundTimer: RoundTimer
  roundSince: number | null
  settings: { startMs: number }
}

export type MatchAction =
  | { type: 'TAP_HALF'; player: PlayerIndex; now: number }
  | { type: 'PAUSE'; now: number }
  | { type: 'RESUME'; now: number }
  | { type: 'TIMEOUT'; player: PlayerIndex; now: number }
  | { type: 'ADJUST_CHAKRA'; player: PlayerIndex; delta: number }
  | { type: 'RESET_CHAKRA'; player: PlayerIndex }
  | { type: 'ADJUST_MISSION'; player: PlayerIndex; delta: number }
  | { type: 'SET_EDGE'; player: PlayerIndex }
  | { type: 'SET_START_TIME'; ms: number }
  | { type: 'TOGGLE_ROUND_TIMER'; now: number }
  | { type: 'SET_ROUND_DURATION'; ms: number }
  | { type: 'NEW_MATCH' }
```

- [ ] **Step 3: Commit**

```bash
git add src/match/constants.ts src/match/types.ts
git commit -m "Add match constants and types"
```

---

## Task 3: Time formatting

**Files:**
- Create: `src/match/format.ts`, `src/match/format.test.ts`

- [ ] **Step 1: Write the failing test** — `src/match/format.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { formatMs } from './format'

describe('formatMs', () => {
  it('formats whole minutes and seconds', () => {
    expect(formatMs(30 * 60 * 1000)).toBe('30:00')
  })
  it('floors partial seconds', () => {
    expect(formatMs(4 * 60 * 1000 + 39_900)).toBe('04:39')
  })
  it('clamps negatives to 00:00', () => {
    expect(formatMs(-5000)).toBe('00:00')
  })
  it('pads single digits', () => {
    expect(formatMs(9000)).toBe('00:09')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- format`
Expected: FAIL ("formatMs is not a function" / module not found).

- [ ] **Step 3: Implement `src/match/format.ts`**

```ts
export function formatMs(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000))
  const m = Math.floor(total / 60)
  const s = total % 60
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${pad(m)}:${pad(s)}`
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- format`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/match/format.ts src/match/format.test.ts
git commit -m "Add formatMs time formatter"
```

---

## Task 4: Initial state factory

**Files:**
- Create: `src/match/state.ts`, `src/match/state.test.ts`

- [ ] **Step 1: Write the failing test** — `src/match/state.test.ts`:

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- state`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement `src/match/state.ts`**

```ts
import type { Match, Player } from './types'
import { MIN_START_MS, BASE_CHAKRA, DEFAULT_ROUND_MS } from './constants'

export function createInitialMatch(startMs: number = MIN_START_MS): Match {
  const start = Math.max(MIN_START_MS, startMs)
  const player = (name: string): Player => ({
    name,
    chakra: BASE_CHAKRA,
    mission: 0,
    clockMs: start,
    timedOut: false,
  })
  return {
    players: [player('Player 1'), player('Player 2')],
    active: null,
    activeSince: null,
    edge: null,
    paused: true,
    roundTimer: { enabled: false, durationMs: DEFAULT_ROUND_MS, remainingMs: DEFAULT_ROUND_MS },
    roundSince: null,
    settings: { startMs: start },
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- state`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/match/state.ts src/match/state.test.ts
git commit -m "Add initial match state factory"
```

---

## Task 5: Live timer derivation

**Files:**
- Create: `src/match/timing.ts`, `src/match/timing.test.ts`

- [ ] **Step 1: Write the failing test** — `src/match/timing.test.ts`:

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- timing`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement `src/match/timing.ts`**

```ts
import type { Match, PlayerIndex } from './types'

export function liveClockMs(m: Match, index: PlayerIndex, now: number): number {
  const stored = m.players[index].clockMs
  if (m.active === index && !m.paused && m.activeSince != null) {
    return Math.max(0, stored - (now - m.activeSince))
  }
  return Math.max(0, stored)
}

export function liveRoundMs(m: Match, now: number): number {
  const { enabled, remainingMs } = m.roundTimer
  if (enabled && !m.paused && m.roundSince != null) {
    return Math.max(0, remainingMs - (now - m.roundSince))
  }
  return Math.max(0, remainingMs)
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- timing`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add src/match/timing.ts src/match/timing.test.ts
git commit -m "Add live timer derivation helpers"
```

---

## Task 6: Reducer — clock actions

**Files:**
- Create: `src/match/reducer.ts`, `src/match/reducer.test.ts`

The reducer uses an internal `settle(now)` that folds elapsed time of the running clock and round timer back into stored values, clamps to zero, and re-stamps the `*Since` timestamps so a still-running timer continues from the folded value.

- [ ] **Step 1: Write the failing test** — `src/match/reducer.test.ts`:

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- reducer`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement `src/match/reducer.ts`** (clock actions + settle; other actions added in Task 7)

```ts
import type { Match, MatchAction, Player, PlayerIndex } from './types'
import { createInitialMatch } from './state'

function settle(m: Match, now: number): Match {
  let players = m.players
  if (m.active != null && !m.paused && m.activeSince != null) {
    const idx = m.active
    const remaining = Math.max(0, m.players[idx].clockMs - (now - m.activeSince))
    const updated: Player = { ...m.players[idx], clockMs: remaining, timedOut: remaining === 0 ? true : m.players[idx].timedOut }
    players = idx === 0 ? [updated, m.players[1]] : [m.players[0], updated]
  }
  let roundTimer = m.roundTimer
  if (roundTimer.enabled && !m.paused && m.roundSince != null) {
    roundTimer = { ...roundTimer, remainingMs: Math.max(0, roundTimer.remainingMs - (now - m.roundSince)) }
  }
  const running = m.active != null && !m.paused
  return {
    ...m,
    players,
    roundTimer,
    activeSince: running ? now : null,
    roundSince: roundTimer.enabled && running ? now : null,
  }
}

function setPlayer(m: Match, index: PlayerIndex, patch: Partial<Player>): Match {
  const updated = { ...m.players[index], ...patch }
  const players: [Player, Player] = index === 0 ? [updated, m.players[1]] : [m.players[0], updated]
  return { ...m, players }
}

export function matchReducer(m: Match, action: MatchAction): Match {
  switch (action.type) {
    case 'TAP_HALF': {
      const settled = settle(m, action.now)
      const next: PlayerIndex = action.player === 0 ? 1 : 0
      return { ...settled, paused: false, active: next, activeSince: action.now,
        roundSince: settled.roundTimer.enabled ? action.now : null }
    }
    case 'PAUSE': {
      const settled = settle(m, action.now)
      return { ...settled, paused: true, activeSince: null, roundSince: null }
    }
    case 'RESUME': {
      if (m.active == null) return m
      return { ...m, paused: false, activeSince: action.now,
        roundSince: m.roundTimer.enabled ? action.now : null }
    }
    case 'TIMEOUT': {
      const settled = settle(m, action.now)
      const stopped = setPlayer(settled, action.player, { clockMs: 0, timedOut: true })
      const wasActive = settled.active === action.player
      return wasActive ? { ...stopped, active: null, activeSince: null } : stopped
    }
    default:
      return m
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- reducer`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/match/reducer.ts src/match/reducer.test.ts
git commit -m "Add reducer clock actions with timestamp settling"
```

---

## Task 7: Reducer — counters, edge, settings, round timer, new match

**Files:**
- Modify: `src/match/reducer.ts`, `src/match/reducer.test.ts`

- [ ] **Step 1: Append failing tests** to `src/match/reducer.test.ts`:

```ts
import { MIN_START_MS as MIN, BASE_CHAKRA, DEFAULT_ROUND_MS } from './constants'

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
    expect(m.settings.startMs).toBe(MIN)
    expect(m.players[0].clockMs).toBe(MIN)
    expect(m.players[1].clockMs).toBe(MIN)
    expect(m.active).toBeNull()
    expect(m.paused).toBe(true)
  })
  it('TOGGLE_ROUND_TIMER flips enabled', () => {
    const m = matchReducer(fresh(), { type: 'TOGGLE_ROUND_TIMER', now: 0 })
    expect(m.roundTimer.enabled).toBe(true)
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- reducer`
Expected: FAIL (new cases fall through `default` and return unchanged state).

- [ ] **Step 3: Add the cases** to the `switch` in `src/match/reducer.ts`, before `default:`:

```ts
    case 'ADJUST_CHAKRA':
      return setPlayer(m, action.player, { chakra: Math.max(0, m.players[action.player].chakra + action.delta) })
    case 'RESET_CHAKRA':
      return setPlayer(m, action.player, { chakra: BASE_CHAKRA })
    case 'ADJUST_MISSION':
      return setPlayer(m, action.player, { mission: Math.max(0, m.players[action.player].mission + action.delta) })
    case 'SET_EDGE':
      return { ...m, edge: m.edge === action.player ? null : action.player }
    case 'SET_START_TIME': {
      const start = Math.max(MIN_START_MS, action.ms)
      return {
        ...m,
        settings: { startMs: start },
        active: null,
        activeSince: null,
        paused: true,
        players: [
          { ...m.players[0], clockMs: start, timedOut: false },
          { ...m.players[1], clockMs: start, timedOut: false },
        ],
      }
    }
    case 'TOGGLE_ROUND_TIMER': {
      const settled = settle(m, action.now)
      const enabled = !settled.roundTimer.enabled
      return {
        ...settled,
        roundTimer: { ...settled.roundTimer, enabled },
        roundSince: enabled && !settled.paused && settled.active != null ? action.now : null,
      }
    }
    case 'SET_ROUND_DURATION':
      return { ...m, roundTimer: { ...m.roundTimer, durationMs: action.ms, remainingMs: action.ms }, roundSince: null }
    case 'NEW_MATCH': {
      const seed = createInitialMatch(m.settings.startMs)
      return {
        ...seed,
        roundTimer: { enabled: m.roundTimer.enabled, durationMs: m.roundTimer.durationMs, remainingMs: m.roundTimer.durationMs },
      }
    }
```

Add the imports at the top of `reducer.ts`:

```ts
import { BASE_CHAKRA, MIN_START_MS } from './constants'
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- reducer`
Expected: PASS (all reducer tests).

- [ ] **Step 5: Commit**

```bash
git add src/match/reducer.ts src/match/reducer.test.ts
git commit -m "Add reducer counter, edge, settings and round-timer actions"
```

---

## Task 8: Persistence

**Files:**
- Create: `src/match/storage.ts`, `src/match/storage.test.ts`

- [ ] **Step 1: Write the failing test** — `src/match/storage.test.ts`:

```ts
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
  it('returns null on corrupt data', () => {
    localStorage.setItem(STORAGE_KEY, '{not json')
    expect(loadMatch()).toBeNull()
  })
  it('returns null when shape is invalid', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ foo: 1 }))
    expect(loadMatch()).toBeNull()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- storage`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement `src/match/storage.ts`**

```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- storage`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/match/storage.ts src/match/storage.test.ts
git commit -m "Add localStorage persistence with validation"
```

---

## Task 9: Match context, provider, and clock tick

**Files:**
- Create: `src/match/MatchContext.tsx`, `src/match/MatchContext.test.tsx`

- [ ] **Step 1: Write the failing test** — `src/match/MatchContext.test.tsx`:

```tsx
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MatchProvider, useMatch } from './MatchContext'

function Probe() {
  const { match, dispatch } = useMatch()
  return (
    <div>
      <span data-testid="edge">{String(match.edge)}</span>
      <button onClick={() => dispatch({ type: 'SET_EDGE', player: 0 })}>edge0</button>
    </div>
  )
}

beforeEach(() => localStorage.clear())

describe('MatchProvider', () => {
  it('provides state and dispatch, and persists changes', async () => {
    render(<MatchProvider><Probe /></MatchProvider>)
    expect(screen.getByTestId('edge').textContent).toBe('null')
    await userEvent.click(screen.getByText('edge0'))
    expect(screen.getByTestId('edge').textContent).toBe('0')
    expect(localStorage.getItem('mythos-match-v1')).toContain('"edge":0')
  })

  it('rehydrates from localStorage on mount', () => {
    const stored = JSON.stringify({
      players: [
        { name: 'A', chakra: 7, mission: 3, clockMs: 1, timedOut: false },
        { name: 'B', chakra: 5, mission: 0, clockMs: 1, timedOut: false },
      ],
      active: null, activeSince: null, edge: 1, paused: true,
      roundTimer: { enabled: false, durationMs: 1, remainingMs: 1 }, roundSince: null,
      settings: { startMs: 1800000 },
    })
    localStorage.setItem('mythos-match-v1', stored)
    render(<MatchProvider><Probe /></MatchProvider>)
    expect(screen.getByTestId('edge').textContent).toBe('1')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- MatchContext`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement `src/match/MatchContext.tsx`**

```tsx
import { createContext, useContext, useEffect, useReducer, useRef, useState, type ReactNode } from 'react'
import type { Match, MatchAction, PlayerIndex } from './types'
import { matchReducer } from './reducer'
import { createInitialMatch } from './state'
import { loadMatch, saveMatch } from './storage'
import { liveClockMs } from './timing'
import { TICK_MS } from './constants'

interface MatchContextValue {
  match: Match
  dispatch: React.Dispatch<MatchAction>
}

const MatchContext = createContext<MatchContextValue | null>(null)

function init(): Match {
  return loadMatch() ?? createInitialMatch()
}

export function MatchProvider({ children }: { children: ReactNode }) {
  const [match, dispatch] = useReducer(matchReducer, undefined, init)

  // Persist on every state change.
  useEffect(() => { saveMatch(match) }, [match])

  // Detect the active player's clock hitting zero and flag a timeout once.
  useEffect(() => {
    if (match.active == null || match.paused) return
    const idx = match.active
    if (match.players[idx].timedOut) return
    const id = setInterval(() => {
      const now = Date.now()
      if (liveClockMs(match, idx, now) <= 0) {
        dispatch({ type: 'TIMEOUT', player: idx, now })
      }
    }, TICK_MS)
    return () => clearInterval(id)
  }, [match])

  return <MatchContext.Provider value={{ match, dispatch }}>{children}</MatchContext.Provider>
}

export function useMatch(): MatchContextValue {
  const ctx = useContext(MatchContext)
  if (!ctx) throw new Error('useMatch must be used within MatchProvider')
  return ctx
}

/** Re-renders the caller every TICK_MS while running, returning a live `now`. */
export function useNow(running: boolean): number {
  const [now, setNow] = useState(() => Date.now())
  const ref = useRef(running)
  ref.current = running
  useEffect(() => {
    if (!running) { setNow(Date.now()); return }
    const id = setInterval(() => setNow(Date.now()), TICK_MS)
    return () => clearInterval(id)
  }, [running])
  return now
}

export type { PlayerIndex }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- MatchContext`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/match/MatchContext.tsx src/match/MatchContext.test.tsx
git commit -m "Add MatchProvider with persistence, timeout watcher, and useNow"
```

---

## Task 10: Wake Lock hook

**Files:**
- Create: `src/hooks/useWakeLock.ts`, `src/hooks/useWakeLock.test.ts`

- [ ] **Step 1: Write the failing test** — `src/hooks/useWakeLock.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useWakeLock } from './useWakeLock'

const release = vi.fn(() => Promise.resolve())
const request = vi.fn(() => Promise.resolve({ release, addEventListener() {} }))

beforeEach(() => {
  release.mockClear(); request.mockClear()
  // @ts-expect-error test shim
  navigator.wakeLock = { request }
})

describe('useWakeLock', () => {
  it('requests a lock when active', async () => {
    renderHook(() => useWakeLock(true))
    await Promise.resolve()
    expect(request).toHaveBeenCalledWith('screen')
  })
  it('does not request when inactive', async () => {
    renderHook(() => useWakeLock(false))
    await Promise.resolve()
    expect(request).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- useWakeLock`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement `src/hooks/useWakeLock.ts`**

```ts
import { useEffect } from 'react'

type SentinelLike = { release: () => Promise<void> }

export function useWakeLock(active: boolean): void {
  useEffect(() => {
    if (!active) return
    const anyNav = navigator as unknown as { wakeLock?: { request: (t: 'screen') => Promise<SentinelLike> } }
    if (!anyNav.wakeLock) return
    let sentinel: SentinelLike | null = null
    let cancelled = false
    anyNav.wakeLock.request('screen').then((s) => {
      if (cancelled) { s.release().catch(() => {}); return }
      sentinel = s
    }).catch(() => {})
    return () => {
      cancelled = true
      sentinel?.release().catch(() => {})
    }
  }, [active])
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- useWakeLock`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useWakeLock.ts src/hooks/useWakeLock.test.ts
git commit -m "Add useWakeLock hook"
```

---

## Task 11: ClockDisplay component

**Files:**
- Create: `src/components/ClockDisplay.tsx`, `src/components/ClockDisplay.test.tsx`

- [ ] **Step 1: Write the failing test** — `src/components/ClockDisplay.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ClockDisplay } from './ClockDisplay'

describe('ClockDisplay', () => {
  it('renders formatted time', () => {
    render(<ClockDisplay ms={4 * 60 * 1000 + 39_000} timedOut={false} />)
    expect(screen.getByText('04:39')).toBeInTheDocument()
  })
  it('marks time-out state', () => {
    render(<ClockDisplay ms={0} timedOut />)
    expect(screen.getByTestId('clock')).toHaveAttribute('data-timedout', 'true')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- ClockDisplay`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement `src/components/ClockDisplay.tsx`**

```tsx
import { formatMs } from '@/match/format'

export function ClockDisplay({ ms, timedOut }: { ms: number; timedOut: boolean }) {
  return (
    <div
      data-testid="clock"
      data-timedout={timedOut}
      className="text-center font-mono font-bold tabular-nums leading-none data-[timedout=true]:animate-pulse"
      style={{ fontSize: 'clamp(3rem, 14vw, 6rem)', color: 'var(--accent)' }}
    >
      {formatMs(ms)}
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- ClockDisplay`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/ClockDisplay.tsx src/components/ClockDisplay.test.tsx
git commit -m "Add ClockDisplay component"
```

---

## Task 12: StatTile component (Chakra / Mission)

**Files:**
- Create: `src/components/StatTile.tsx`, `src/components/StatTile.test.tsx`

- [ ] **Step 1: Write the failing test** — `src/components/StatTile.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StatTile } from './StatTile'

describe('StatTile', () => {
  it('renders label and value', () => {
    render(<StatTile label="CHAKRA" value={7} onInc={() => {}} onDec={() => {}} />)
    expect(screen.getByText('CHAKRA')).toBeInTheDocument()
    expect(screen.getByText('7')).toBeInTheDocument()
  })
  it('fires inc/dec/preset/reset handlers', async () => {
    const onInc = vi.fn(), onDec = vi.fn(), onPreset = vi.fn(), onReset = vi.fn()
    render(<StatTile label="CHAKRA" value={7} onInc={onInc} onDec={onDec} preset={5} onPreset={onPreset} onReset={onReset} />)
    await userEvent.click(screen.getByRole('button', { name: '+1' }))
    await userEvent.click(screen.getByRole('button', { name: '-1' }))
    await userEvent.click(screen.getByRole('button', { name: '+5' }))
    await userEvent.click(screen.getByRole('button', { name: /reset/i }))
    expect(onInc).toHaveBeenCalledOnce()
    expect(onDec).toHaveBeenCalledOnce()
    expect(onPreset).toHaveBeenCalledOnce()
    expect(onReset).toHaveBeenCalledOnce()
  })
  it('omits preset and reset when not provided', () => {
    render(<StatTile label="MISSION" value={13} onInc={() => {}} onDec={() => {}} />)
    expect(screen.queryByRole('button', { name: /reset/i })).toBeNull()
    expect(screen.queryByRole('button', { name: '+5' })).toBeNull()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- StatTile`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement `src/components/StatTile.tsx`**

```tsx
import { RotateCcw } from 'lucide-react'

interface StatTileProps {
  label: string
  value: number
  onInc: () => void
  onDec: () => void
  preset?: number
  onPreset?: () => void
  onReset?: () => void
}

export function StatTile({ label, value, onInc, onDec, preset, onPreset, onReset }: StatTileProps) {
  return (
    <div className="flex flex-col items-center gap-2 p-3">
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold tracking-widest opacity-80">{label}</span>
        {onReset && (
          <button aria-label={`Reset ${label}`} onClick={onReset} className="opacity-70 active:opacity-100">
            <RotateCcw size={16} />
          </button>
        )}
      </div>
      <div className="text-4xl font-bold tabular-nums" style={{ color: 'var(--accent)' }}>{value}</div>
      <div className="flex w-full gap-2">
        <button aria-label="-1" onClick={onDec}
          className="flex-1 rounded-lg py-3 text-lg font-bold active:scale-95"
          style={{ background: 'var(--surface)' }}>-1</button>
        {preset != null && onPreset && (
          <button aria-label={`+${preset}`} onClick={onPreset}
            className="flex-1 rounded-lg py-3 text-lg font-bold active:scale-95"
            style={{ background: 'var(--surface)' }}>+{preset}</button>
        )}
        <button aria-label="+1" onClick={onInc}
          className="flex-1 rounded-lg py-3 text-lg font-bold active:scale-95"
          style={{ background: 'var(--accent)', color: 'var(--accent-fg)' }}>+1</button>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- StatTile`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/StatTile.tsx src/components/StatTile.test.tsx
git commit -m "Add StatTile component"
```

---

## Task 13: EdgePill component

**Files:**
- Create: `src/components/EdgePill.tsx`, `src/components/EdgePill.test.tsx`

- [ ] **Step 1: Write the failing test** — `src/components/EdgePill.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { EdgePill } from './EdgePill'

describe('EdgePill', () => {
  it('reflects active state and fires onToggle', async () => {
    const onToggle = vi.fn()
    render(<EdgePill active onToggle={onToggle} />)
    const btn = screen.getByRole('button', { name: /edge/i })
    expect(btn).toHaveAttribute('data-active', 'true')
    await userEvent.click(btn)
    expect(onToggle).toHaveBeenCalledOnce()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- EdgePill`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement `src/components/EdgePill.tsx`**

```tsx
export function EdgePill({ active, onToggle }: { active: boolean; onToggle: () => void }) {
  return (
    <button
      aria-label="Edge"
      data-active={active}
      onClick={onToggle}
      className="rounded-full border-2 px-5 py-1.5 text-sm font-bold transition-colors"
      style={
        active
          ? { background: 'var(--accent)', color: 'var(--accent-fg)', borderColor: 'var(--accent)' }
          : { background: 'transparent', color: 'var(--accent)', borderColor: 'var(--accent)' }
      }
    >
      Edge
    </button>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- EdgePill`
Expected: PASS (1 test).

- [ ] **Step 5: Commit**

```bash
git add src/components/EdgePill.tsx src/components/EdgePill.test.tsx
git commit -m "Add EdgePill component"
```

---

## Task 14: PlayerPanel component

**Files:**
- Create: `src/components/PlayerPanel.tsx`, `src/components/PlayerPanel.test.tsx`

Wires one player's half: theme class, optional 180° rotation, header (name + edge), clock (tap to pass), and the two stat tiles. Reads `useMatch()` and `useNow()`.

- [ ] **Step 1: Write the failing test** — `src/components/PlayerPanel.test.tsx`:

```tsx
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MatchProvider, useMatch } from '@/match/MatchContext'
import { PlayerPanel } from './PlayerPanel'

beforeEach(() => localStorage.clear())

function ActiveProbe() {
  const { match } = useMatch()
  return <span data-testid="active">{String(match.active)}</span>
}

describe('PlayerPanel', () => {
  it('renders the player name and applies rotation when flipped', () => {
    const { container } = render(
      <MatchProvider><PlayerPanel index={0} flipped /></MatchProvider>,
    )
    expect(screen.getByText('Player 1')).toBeInTheDocument()
    expect(container.querySelector('[data-flipped="true"]')).not.toBeNull()
  })

  it('tapping the half passes the clock to the opponent', async () => {
    render(
      <MatchProvider>
        <PlayerPanel index={0} flipped={false} />
        <ActiveProbe />
      </MatchProvider>,
    )
    await userEvent.click(screen.getByTestId('tap-surface-0'))
    expect(screen.getByTestId('active').textContent).toBe('1')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- PlayerPanel`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement `src/components/PlayerPanel.tsx`**

```tsx
import { useMatch, useNow } from '@/match/MatchContext'
import { liveClockMs } from '@/match/timing'
import type { PlayerIndex } from '@/match/types'
import { ClockDisplay } from './ClockDisplay'
import { StatTile } from './StatTile'
import { EdgePill } from './EdgePill'
import { BASE_CHAKRA } from '@/match/constants'

export function PlayerPanel({ index, flipped }: { index: PlayerIndex; flipped: boolean }) {
  const { match, dispatch } = useMatch()
  const running = match.active === index && !match.paused
  const now = useNow(running)
  const player = match.players[index]
  const clock = liveClockMs(match, index, now)

  return (
    <div
      data-flipped={flipped}
      className={`theme-${index === 0 ? 'p1' : 'p2'} relative flex h-full flex-col`}
      style={{ background: 'var(--bg)', color: 'var(--accent)', transform: flipped ? 'rotate(180deg)' : undefined }}
    >
      <div className="flex items-center justify-between px-4 pt-3">
        <span className="text-lg font-bold">{player.name}</span>
        <EdgePill active={match.edge === index} onToggle={() => dispatch({ type: 'SET_EDGE', player: index })} />
      </div>

      <button
        data-testid={`tap-surface-${index}`}
        aria-label={`Pass clock from ${player.name}`}
        onClick={() => dispatch({ type: 'TAP_HALF', player: index, now: Date.now() })}
        className="flex flex-1 items-center justify-center"
      >
        <ClockDisplay ms={clock} timedOut={player.timedOut} />
      </button>

      <div className="grid grid-cols-2">
        <StatTile
          label="CHAKRA"
          value={player.chakra}
          onInc={() => dispatch({ type: 'ADJUST_CHAKRA', player: index, delta: 1 })}
          onDec={() => dispatch({ type: 'ADJUST_CHAKRA', player: index, delta: -1 })}
          preset={BASE_CHAKRA}
          onPreset={() => dispatch({ type: 'ADJUST_CHAKRA', player: index, delta: BASE_CHAKRA })}
          onReset={() => dispatch({ type: 'RESET_CHAKRA', player: index })}
        />
        <StatTile
          label="MISSION"
          value={player.mission}
          onInc={() => dispatch({ type: 'ADJUST_MISSION', player: index, delta: 1 })}
          onDec={() => dispatch({ type: 'ADJUST_MISSION', player: index, delta: -1 })}
        />
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- PlayerPanel`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/PlayerPanel.tsx src/components/PlayerPanel.test.tsx
git commit -m "Add PlayerPanel component"
```

---

## Task 15: CenterBand component

**Files:**
- Create: `src/components/CenterBand.tsx`, `src/components/CenterBand.test.tsx`

Houses pause/resume, the mirrored round timer (when enabled), and a gear link to settings.

- [ ] **Step 1: Write the failing test** — `src/components/CenterBand.test.tsx`:

```tsx
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { MatchProvider, useMatch } from '@/match/MatchContext'
import { CenterBand } from './CenterBand'

beforeEach(() => localStorage.clear())

function PausedProbe() {
  const { match } = useMatch()
  return <span data-testid="paused">{String(match.paused)}</span>
}

describe('CenterBand', () => {
  it('toggles pause/resume', async () => {
    render(
      <MemoryRouter>
        <MatchProvider>
          <CenterBand />
          <PausedProbe />
        </MatchProvider>
      </MemoryRouter>,
    )
    // starts paused -> shows Resume affordance; clicking pause control toggles
    const toggle = screen.getByRole('button', { name: /pause|resume/i })
    await userEvent.click(toggle)
    expect(screen.getByTestId('paused').textContent).toBe('false')
  })

  it('shows the round timer only when enabled', () => {
    render(
      <MemoryRouter>
        <MatchProvider><CenterBand /></MatchProvider>
      </MemoryRouter>,
    )
    expect(screen.queryByTestId('round-timer')).toBeNull()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- CenterBand`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement `src/components/CenterBand.tsx`**

```tsx
import { Link } from 'react-router-dom'
import { Pause, Play, Settings } from 'lucide-react'
import { useMatch, useNow } from '@/match/MatchContext'
import { liveRoundMs } from '@/match/timing'
import { formatMs } from '@/match/format'

export function CenterBand() {
  const { match, dispatch } = useMatch()
  const running = !match.paused && match.active != null
  const now = useNow(running && match.roundTimer.enabled)
  const roundMs = liveRoundMs(match, now)

  const toggle = () =>
    match.paused
      ? dispatch({ type: 'RESUME', now: Date.now() })
      : dispatch({ type: 'PAUSE', now: Date.now() })

  return (
    <div className="flex items-center justify-between gap-4 bg-neutral-900 px-4 py-1 text-neutral-200">
      {match.roundTimer.enabled ? (
        <span data-testid="round-timer" className="rotate-180 font-mono text-sm tabular-nums">{formatMs(roundMs)}</span>
      ) : <span className="w-10" />}

      <button aria-label={match.paused ? 'Resume' : 'Pause'} onClick={toggle} className="rounded-full bg-neutral-700 p-2 active:scale-95">
        {match.paused ? <Play size={20} /> : <Pause size={20} />}
      </button>

      {match.roundTimer.enabled ? (
        <span className="font-mono text-sm tabular-nums">{formatMs(roundMs)}</span>
      ) : (
        <Link to="/settings" aria-label="Settings" className="p-2"><Settings size={20} /></Link>
      )}
    </div>
  )
}
```

> Note: when the round timer is enabled the settings gear moves into the Settings screen's own nav; the band keeps a mirrored round timer on both ends so each player reads it upright. When disabled, the right slot holds the settings gear. The Settings screen is always reachable from the round timer's adjacent gear (added in Task 17) — verify the gear is reachable in at least one state during manual testing.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- CenterBand`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/CenterBand.tsx src/components/CenterBand.test.tsx
git commit -m "Add CenterBand component"
```

---

## Task 16: MatchScreen

**Files:**
- Create: `src/screens/MatchScreen.tsx`, `src/screens/MatchScreen.test.tsx`

- [ ] **Step 1: Write the failing test** — `src/screens/MatchScreen.test.tsx`:

```tsx
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { MatchProvider } from '@/match/MatchContext'
import { MatchScreen } from './MatchScreen'

beforeEach(() => localStorage.clear())

describe('MatchScreen', () => {
  it('renders both player panels', () => {
    render(
      <MemoryRouter>
        <MatchProvider><MatchScreen /></MatchProvider>
      </MemoryRouter>,
    )
    expect(screen.getByText('Player 1')).toBeInTheDocument()
    expect(screen.getByText('Player 2')).toBeInTheDocument()
    expect(screen.getByTestId('tap-surface-0')).toBeInTheDocument()
    expect(screen.getByTestId('tap-surface-1')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- MatchScreen`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement `src/screens/MatchScreen.tsx`**

```tsx
import { PlayerPanel } from '@/components/PlayerPanel'
import { CenterBand } from '@/components/CenterBand'
import { useMatch } from '@/match/MatchContext'
import { useWakeLock } from '@/hooks/useWakeLock'

export function MatchScreen() {
  const { match } = useMatch()
  useWakeLock(!match.paused && match.active != null)
  return (
    <div className="flex h-full flex-col">
      <div className="min-h-0 flex-1"><PlayerPanel index={1} flipped /></div>
      <CenterBand />
      <div className="min-h-0 flex-1"><PlayerPanel index={0} flipped={false} /></div>
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- MatchScreen`
Expected: PASS (1 test).

- [ ] **Step 5: Commit**

```bash
git add src/screens/MatchScreen.tsx src/screens/MatchScreen.test.tsx
git commit -m "Add MatchScreen layout"
```

---

## Task 17: SettingsScreen

**Files:**
- Create: `src/screens/SettingsScreen.tsx`, `src/screens/SettingsScreen.test.tsx`

Controls: start-time minutes (≥30), round-timer enable + duration, New Match, back to match.

- [ ] **Step 1: Write the failing test** — `src/screens/SettingsScreen.test.tsx`:

```tsx
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { MatchProvider, useMatch } from '@/match/MatchContext'
import { SettingsScreen } from './SettingsScreen'

beforeEach(() => localStorage.clear())

function StartProbe() {
  const { match } = useMatch()
  return <span data-testid="start">{match.settings.startMs}</span>
}

describe('SettingsScreen', () => {
  it('enforces the 30-minute floor on start time', async () => {
    render(
      <MemoryRouter>
        <MatchProvider><SettingsScreen /><StartProbe /></MatchProvider>
      </MemoryRouter>,
    )
    const input = screen.getByLabelText(/minutes per player/i)
    await userEvent.clear(input)
    await userEvent.type(input, '10')
    await userEvent.click(screen.getByRole('button', { name: /apply time/i }))
    expect(screen.getByTestId('start').textContent).toBe(String(30 * 60 * 1000))
  })

  it('toggles the round timer', async () => {
    render(
      <MemoryRouter>
        <MatchProvider><SettingsScreen /></MatchProvider>
      </MemoryRouter>,
    )
    const sw = screen.getByRole('switch', { name: /round timer/i })
    await userEvent.click(sw)
    expect(sw).toBeChecked()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- SettingsScreen`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement `src/screens/SettingsScreen.tsx`**

```tsx
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useMatch } from '@/match/MatchContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { MIN_START_MS } from '@/match/constants'

export function SettingsScreen() {
  const { match, dispatch } = useMatch()
  const [minutes, setMinutes] = useState(String(Math.round(match.settings.startMs / 60000)))
  const [roundMinutes, setRoundMinutes] = useState(String(Math.round(match.roundTimer.durationMs / 60000)))

  return (
    <div className="mx-auto flex h-full max-w-md flex-col gap-6 p-6 text-neutral-100" style={{ background: '#0f172a' }}>
      <div className="flex items-center gap-3">
        <Link to="/" aria-label="Back to match"><ArrowLeft /></Link>
        <h1 className="text-xl font-bold">Settings</h1>
      </div>

      <div className="space-y-2">
        <Label htmlFor="start">Minutes per player (min 30)</Label>
        <div className="flex gap-2">
          <Input id="start" type="number" inputMode="numeric" min={30} value={minutes}
            onChange={(e) => setMinutes(e.target.value)} />
          <Button onClick={() => dispatch({ type: 'SET_START_TIME', ms: Math.max(MIN_START_MS, Number(minutes) * 60000) })}>
            Apply time
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor="round">Shared round timer</Label>
        <Switch id="round" aria-label="Round timer" checked={match.roundTimer.enabled}
          onCheckedChange={() => dispatch({ type: 'TOGGLE_ROUND_TIMER', now: Date.now() })} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="roundlen">Round length (minutes)</Label>
        <div className="flex gap-2">
          <Input id="roundlen" type="number" inputMode="numeric" min={1} value={roundMinutes}
            onChange={(e) => setRoundMinutes(e.target.value)} />
          <Button onClick={() => dispatch({ type: 'SET_ROUND_DURATION', ms: Math.max(1, Number(roundMinutes)) * 60000 })}>
            Apply round
          </Button>
        </div>
      </div>

      <Button variant="destructive" onClick={() => dispatch({ type: 'NEW_MATCH' })}>New match</Button>
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- SettingsScreen`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/screens/SettingsScreen.tsx src/screens/SettingsScreen.test.tsx
git commit -m "Add SettingsScreen"
```

---

## Task 18: App router and entry

**Files:**
- Modify: `src/App.tsx`, `src/main.tsx`
- Create: `src/App.test.tsx`

- [ ] **Step 1: Write the failing test** — `src/App.test.tsx`:

```tsx
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from './App'

beforeEach(() => localStorage.clear())

describe('App', () => {
  it('renders the match screen at the default route', () => {
    render(<App />)
    expect(screen.getByText('Player 1')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- App`
Expected: FAIL (App still renders the Vite starter).

- [ ] **Step 3: Replace `src/App.tsx`**

```tsx
import { HashRouter, Routes, Route } from 'react-router-dom'
import { MatchProvider } from '@/match/MatchContext'
import { MatchScreen } from '@/screens/MatchScreen'
import { SettingsScreen } from '@/screens/SettingsScreen'

export default function App() {
  return (
    <MatchProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<MatchScreen />} />
          <Route path="/settings" element={<SettingsScreen />} />
        </Routes>
      </HashRouter>
    </MatchProvider>
  )
}
```

- [ ] **Step 4: Replace `src/main.tsx`**

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode><App /></StrictMode>,
)
```

- [ ] **Step 5: Delete starter cruft**

```bash
rm -f src/App.css src/assets/react.svg
```

(If `App.css` import lingered, it was removed when replacing `App.tsx`.)

- [ ] **Step 6: Run test to verify it passes**

Run: `npm test -- App`
Expected: PASS (1 test).

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "Wire HashRouter, MatchProvider, and app entry"
```

---

## Task 19: PWA manifest and meta

**Files:**
- Create: `public/manifest.webmanifest`, `public/icon-192.png`, `public/icon-512.png`
- Modify: `index.html`

- [ ] **Step 1: Create `public/manifest.webmanifest`**

```json
{
  "name": "Mythos TCG Arena Counter",
  "short_name": "Mythos Timer",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#0f172a",
  "theme_color": "#0f172a",
  "start_url": "./",
  "icons": [
    { "src": "./icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "./icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

- [ ] **Step 2: Generate placeholder icons**

```bash
node -e "const b=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==','base64');require('fs').writeFileSync('public/icon-192.png',b);require('fs').writeFileSync('public/icon-512.png',b)"
```

(1×1 PNG placeholders so the manifest validates; replace with real artwork later.)

- [ ] **Step 3: Update `index.html` `<head>`** — set title and add manifest + theme + viewport (replace any existing `<title>` and viewport meta):

```html
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, maximum-scale=1, user-scalable=no" />
    <meta name="theme-color" content="#0f172a" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <link rel="manifest" href="./manifest.webmanifest" />
    <title>Mythos TCG Arena Counter</title>
```

- [ ] **Step 4: Verify build includes manifest**

Run: `npm run build`
Expected: build succeeds; `dist/manifest.webmanifest` and `dist/icon-*.png` present.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "Add PWA manifest, icons, and mobile meta tags"
```

---

## Task 20: Full verification pass

**Files:** none (manual + automated verification)

- [ ] **Step 1: Run the whole test suite**

Run: `npm test`
Expected: ALL tests pass. Record the count.

- [ ] **Step 2: Production build**

Run: `npm run build`
Expected: succeeds with no type errors.

- [ ] **Step 3: Manual smoke in a real browser**

Run: `npm run dev`, open on a phone (or devtools device mode, portrait). Verify against the spec's verification list:
- Tap Player 1's half → Player 2's clock starts counting; only it decrements.
- Tap Player 2's half → passes back; each bank only loses its own time.
- Pause halts both clocks; Resume continues the same player.
- Enable round timer in Settings → mirrored countdown shows in centre band on both orientations and runs concurrently.
- Let a clock reach `00:00` → it clamps and the side pulses/flags; match continues.
- Chakra `-1/+1/+5/reset→5`; Mission `-1/+1`; neither goes below 0.
- Edge pill is exclusive; tapping the holder clears it.
- Settings start time enforces ≥30 min.
- Reload mid-match → timers, scores, chakra, edge restored (running clock within ~1s of elapsed).
- Player 2 half reads upright when the phone is rotated 180° on a table.
- Wake Lock keeps the screen on while a clock runs (supported browsers).

- [ ] **Step 4: Commit any fixes found during manual testing**

```bash
git add -A
git commit -m "Fix issues found during verification"
```

---

## Self-Review Notes (author)

- **Spec coverage:** split-screen + rotation (Task 14/16), per-player themes (Task 1 css + 14), chess clock tap-to-pass (6, 14), concurrent round timer (5, 7, 15), timeout flag (6, 9, 11), chakra with +5 preset & reset-to-5 (7, 12, 14), mission running total (7, 12, 14), exclusive edge (7, 13), settings ≥30 min (7, 17), persistence/refresh-survival (8, 9), wake lock (10, 16), manifest (19). All spec sections map to a task.
- **Timestamp timing** (spec §5) realised by `liveClockMs`/`liveRoundMs` + reducer `settle` (Tasks 5–7) and the `useNow` render tick (Task 9).
- **Out of scope** (stats, sound, offline SW) intentionally absent.
- **Type consistency:** action names and `Match`/`Player` fields are identical across reducer (6/7), context (9), and components (11–17).
