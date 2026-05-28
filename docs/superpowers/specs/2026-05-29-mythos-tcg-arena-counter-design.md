# Mythos TCG Arena Counter (PWA) — Design Spec

**Date:** 2026-05-29
**Status:** Approved (pending spec review)

## Context

A player of the *Naruto Mythos TCG* uses an Android device and therefore cannot
use the iOS-only **Mythos TCG Arena Timer** app
(https://apps.apple.com/gb/app/mythos-tcg-arena-timer/id6761826044). This project
reproduces that app's core feature set as a **client-only PWA** that runs in any
mobile browser, so any player can load it regardless of platform. It will
eventually be hosted as a single static page on the owner's website — there is no
server-side logic, all state lives client-side.

The original app is a **split-screen tabletop companion**: one phone laid flat on
the table between two players, the opponent's half rotated 180°. It bundles a
chess-clock duel timer, a per-player Chakra counter, per-player Mission-point
score tracking, and an Edge-token indicator. (A "Statistics" feature exists in the
original but is **out of scope for v1** — see below.)

Ground truth for the layout is a real screenshot of the running app, confirmed by
the owner's partner who has used it.

## Game context (informs the model)

Naruto Mythos TCG: fixed 4-round match, win by most **Mission Points** (missions
escalate D→C→B→A rank). **Chakra** accumulates across rounds (base 5 per round +
characters in play). The **Edge token** governs turn order / tie-breaks and is held
by exactly one player at a time. The base game has no per-turn clock; timing comes
from tournament play, which is why the app provides a chess clock.

## Confirmed requirements (from grilling)

- **Usage model:** one shared phone, flat on table; Player 2's half rotated 180°. No networking.
- **Single combined match screen** (timer + chakra + mission + edge all visible).
- **Timer:** chess-clock per player (tap *your own half* to stop your clock and start the opponent's) **plus** an optional **concurrent shared round timer**.
- **Start time:** manually adjustable, **minimum 30 minutes**, may be higher.
- **Time-out:** clock clamps at `00:00` and that side is **visually flagged**; match continues.
- **Edge pill:** **exclusive** toggle — assigning it to one player clears the other.
- **Chakra:** big value with `−1`/`+1`, a **↻ reset that always sets it to 5**, and a **`+5` quick-preset** (round base — an improvement over the original).
- **Mission:** running point total per player with `−1`/`+1`.
- **PWA extras for v1:** **keep screen awake** (Wake Lock), **survive refresh/reload** (localStorage). Plus a **web app manifest** for Add-to-Home-Screen (no offline caching yet).

## Tech stack

- **Vite + React + TypeScript** — static SPA, builds to plain HTML/JS/CSS for single-page hosting.
- **Tailwind CSS + shadcn/ui** — shadcn `Button`, `Dialog`/`Sheet`, `Slider`/`Input`, `Switch`; custom components for the timer/counter tiles.
- **react-router-dom (HashRouter)** — `#/` match, `#/settings`. Hash routing = no server rewrites, works at any sub-path.
- **lucide-react** — `RotateCcw`, `Pause`, `Play`, `Settings`, `Plus`, `Minus`.
- **localStorage** — persistence.
- **State:** React **Context + `useReducer`** (no external state library).

## Screens & routing

- **Match** (`#/`) — the split-screen counter; the heart of the app.
- **Settings** (`#/settings`) — starting time (≥30 min), round-timer enable + duration, reset / new match. Reached via a gear in the centre band.

## Match screen layout (faithful to screenshot)

Vertical split into two equal halves. **Player 2 (top) wrapped in `rotate(180deg)`**
to read upright across the table. Per-player theme tokens: **P1 maroon/orange**,
**P2 blue/cyan**. Each half, top → bottom:

1. Header row: **player name** + **Edge pill** (exclusive).
2. **Large chess-clock timer** — tap anywhere on *that player's half* to pass the clock.
3. Two **stat tiles**:
   - `CHAKRA` — value, `−1`/`+1`, `+5` preset, ↻ reset-to-5.
   - `MISSION` — value, `−1`/`+1`.

**Centre band** between halves: **Pause/Resume** (all clocks), the optional
**shared round timer** rendered **twice mirrored** (both players read upright), and
the **gear → Settings**.

## State model

```ts
type Player = {
  name: string
  chakra: number       // starts 5, reset → 5
  mission: number      // starts 0
  clockMs: number      // remaining time bank
  timedOut: boolean
}

type RoundTimer = {
  enabled: boolean
  durationMs: number
  remainingMs: number
}

type Match = {
  players: [Player, Player]
  active: 0 | 1 | null      // whose clock runs; null = paused/idle
  activeSince: number | null // timestamp the active clock (re)started
  edge: 0 | 1 | null         // exclusive Edge holder
  paused: boolean
  roundTimer: RoundTimer
  roundSince: number | null  // timestamp round timer (re)started
  settings: { startMs: number }  // floor 30 min, enforced in Settings UI
}
```

Reducer actions (representative): `TAP_HALF(player)`, `PAUSE`, `RESUME`,
`ADJUST_CHAKRA(player, delta)`, `RESET_CHAKRA(player)`, `ADJUST_MISSION(player, delta)`,
`SET_EDGE(player)`, `SET_START_TIME(ms)`, `TOGGLE_ROUND_TIMER`, `SET_ROUND_DURATION(ms)`,
`NEW_MATCH`. Initial: chakra 5, mission 0, edge null, both clocks = `startMs`, paused.

## Timer engine (correctness-critical)

**Timestamp-based, not tick-decrement.** Remaining time is *derived*:

```
displayedRemaining = clockMs − (now − activeSince)   // for the running clock
```

A ~250ms interval (or `requestAnimationFrame`) only triggers re-render; the source
of truth is `clockMs` + `activeSince`. On pause/switch, fold elapsed back into
`clockMs` and clear `activeSince`. At ≤0: clamp to `00:00`, set `timedOut`, flag the
side. The shared round timer uses the identical pattern via `remainingMs` +
`roundSince`, running whenever `!paused`.

Rationale: naive `setInterval` decrement drifts and *freezes* under mobile
background-tab throttling (a locked phone would under-count). Deriving from
wall-clock timestamps stays accurate across backgrounding and makes
refresh-survival exact.

## Persistence

Serialise `Match` to `localStorage` on change (debounced). On load, rehydrate;
because timing is timestamp-based, an in-progress running clock reconstructs to the
correct remaining value after a refresh. `NEW_MATCH` clears and re-seeds.

## Keep-awake

Use the **Screen Wake Lock API** while a match screen is mounted and a clock is
running; release on pause/unmount. Feature-detect and degrade silently where
unsupported (e.g. older iOS Safari).

## PWA manifest

Minimal `manifest.webmanifest` (name, icons, `display: standalone`, theme colours)
so the app can be added to the home screen and launch fullscreen. **No service
worker / offline caching in v1.**

## Improvements over the original (in v1)

- Chakra **`+5` quick-preset** (round base) alongside `−1`/`+1`.
- **Refresh-survival** and **keep-awake** (original is a native app; these make the
  web version robust).

## Out of scope for v1

- Statistics / match history.
- Sound & vibration cues.
- Full offline service worker.
- Round (1–4) indicator, undo. (Candidate fast-follows.)

## Verification

- **Manual, in real browser (mobile + desktop devtools):**
  - Chess clock: start, tap-own-half passes clock to opponent; only the active clock counts down.
  - Concurrent round timer counts down independently when enabled.
  - Time-out clamps at `00:00` and flags the side.
  - Chakra `−1`/`+1`/`+5`/↻-to-5; Mission `−1`/`+1`; values can't be driven below sensible floors (chakra/mission ≥ 0).
  - Edge pill exclusivity (assigning clears the other).
  - Settings: start time enforces ≥30 min; round-timer toggle + duration.
  - **Refresh mid-match** restores timers/scores/chakra/edge accurately (within ~1s of elapsed).
  - Player 2 half renders upright when phone is rotated 180° on a table.
  - Wake Lock holds the screen on while a clock runs (where supported).
- **Build:** `npm run build` produces a static bundle that loads from `file://`-style sub-path hosting via HashRouter.
