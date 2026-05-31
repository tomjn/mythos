# Theme System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add five user-selectable colour themes (Naruto default, Monochrome, Kurama, Forbidden Scroll, Konoha), chosen in Settings and remembered across sessions and matches via localStorage.

**Architecture:** A typed theme registry (`themes.ts`) holds pure colour data plus a `panelVars()` resolver that maps `(theme, player, panel-state) → CSS custom properties`. A `ThemeProvider` persists the selected theme id to its own localStorage key and exposes `useTheme()`. `PlayerPanel` is the single place that applies the resolved vars; `StatTile`/`ClockDisplay`/`EdgePill` are dumb consumers of those vars. `CenterBand`/`MatchScreen` read per-theme chrome/backdrop colours.

**Tech Stack:** React 18 + TypeScript, Vite, Vitest + Testing Library, Tailwind, CSS custom properties.

---

## Background for the implementer

- Theming today lives in `src/index.css` as `.theme-p1` / `.theme-p2` classes setting `--player-bg`, `--player-surface`, `--player-accent`, `--player-accent-fg`. `PlayerPanel` adds the `.theme-pN` class and computes the waiting-dim + active-ring inline. This plan **replaces** those classes with the registry.
- Two rendering models must coexist:
  - **filled / dim** (Naruto, Kurama, Scroll, Konoha): each player has a fixed palette; the active half shows full colour, the waiting half dims its background, buttons are solid fills.
  - **outline / invert** (Monochrome): the active half is white panel + black ink, the waiting half swaps to black panel + white ink, buttons are transparent with coloured outlines.
- `panelVars()` collapses both models into one flat set of CSS variables so components never branch on theme.
- Tests use Vitest. Run a single file with `npx vitest run <path>`. Run all with `npm test` (check `package.json` for the exact script).
- The match localStorage key is `mythos-match-v1`. The new theme key is `mythos-theme-v1` — keep them separate so `New match` never resets the theme.

## File structure

- **Create** `src/match/themes.ts` — `Theme`/`HalfTheme` types, `THEMES` array, `getTheme()`, `panelVars()`, `PanelState` type.
- **Create** `src/match/themes.test.ts` — registry shape + resolver behaviour.
- **Create** `src/match/ThemeContext.tsx` — `ThemeProvider`, `useTheme`, localStorage read/write.
- **Create** `src/match/ThemeContext.test.tsx` — persistence + default fallback.
- **Modify** `src/App.tsx` — wrap tree in `ThemeProvider`.
- **Modify** `src/components/PlayerPanel.tsx` — apply `panelVars()`; drop `.theme-pN` class.
- **Modify** `src/components/StatTile.tsx` — buttons read `--btn-*` vars + `border-2`.
- **Modify** `src/components/ClockDisplay.tsx` — read `--clock-warn`/`--clock-danger`.
- **Modify** `src/components/EdgePill.tsx` — active text uses `--player-bg` (drop `--player-accent-fg`).
- **Modify** `src/components/CenterBand.tsx` — chrome bg/ink from theme.
- **Modify** `src/screens/MatchScreen.tsx` — gap background from theme backdrop.
- **Modify** `src/screens/SettingsScreen.tsx` — Appearance theme picker.
- **Modify** `src/index.css` — remove `.theme-p1` / `.theme-p2` blocks.

---

## Task 1: Theme registry + resolver

**Files:**
- Create: `src/match/themes.ts`
- Test: `src/match/themes.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/match/themes.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { THEMES, DEFAULT_THEME_ID, getTheme, panelVars } from './themes'

describe('theme registry', () => {
  it('ships five themes with unique ids', () => {
    expect(THEMES).toHaveLength(5)
    const ids = THEMES.map((t) => t.id)
    expect(new Set(ids).size).toBe(5)
    expect(ids).toContain(DEFAULT_THEME_ID)
  })

  it('every theme is fully specified', () => {
    for (const t of THEMES) {
      expect(t.label.length).toBeGreaterThan(0)
      expect(t.players).toHaveLength(2)
      for (const half of t.players) {
        for (const k of ['bg', 'ink', 'surface', 'accent', 'accentInk'] as const) {
          expect(typeof half[k]).toBe('string')
          expect(half[k].length).toBeGreaterThan(0)
        }
      }
    }
  })

  it('getTheme falls back to the default for unknown or null ids', () => {
    expect(getTheme(null).id).toBe(DEFAULT_THEME_ID)
    expect(getTheme('does-not-exist').id).toBe(DEFAULT_THEME_ID)
    expect(getTheme('mono').id).toBe('mono')
  })
})

describe('panelVars (filled / dim theme)', () => {
  const naruto = getTheme('naruto')

  it('active half uses the full background and filled buttons', () => {
    const v = panelVars(naruto, 0, 'active')
    expect(v['--player-bg']).toBe('#5b1418')
    expect(v['--player-accent']).toBe('#f59e42')
    expect(v['--btn-plus-fill']).toBe('#f59e42')
    expect(v['--btn-plus-border']).toBe('transparent')
    expect(v['--btn-minus-fill']).toBe('#7a1c22')
  })

  it('waiting half dims the background toward the backdrop', () => {
    const v = panelVars(naruto, 0, 'waiting')
    expect(v['--player-bg']).toContain('color-mix')
    expect(v['--player-bg']).toContain('#171717')
    expect(v['--player-accent']).toBe('#f59e42') // ink unchanged
  })
})

describe('panelVars (outline / invert theme)', () => {
  const mono = getTheme('mono')

  it('active half is white panel with black ink and outline buttons', () => {
    const v = panelVars(mono, 0, 'active')
    expect(v['--player-bg']).toBe('#ffffff')
    expect(v['--player-accent']).toBe('#000000')
    expect(v['--btn-plus-fill']).toBe('transparent')
    expect(v['--btn-plus-border']).toBe('#000000')
    expect(v['--btn-plus-ink']).toBe('#000000')
  })

  it('waiting half swaps to black panel with white ink', () => {
    const v = panelVars(mono, 0, 'waiting')
    expect(v['--player-bg']).toBe('#000000')
    expect(v['--player-accent']).toBe('#ffffff')
    expect(v['--btn-plus-border']).toBe('#ffffff')
  })

  it('exposes the theme warn/danger colours', () => {
    const v = panelVars(mono, 0, 'active')
    expect(v['--clock-warn']).toBe('#b45309')
    expect(v['--clock-danger']).toBe('#ef4444')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/match/themes.test.ts`
Expected: FAIL — cannot resolve `./themes`.

- [ ] **Step 3: Write the implementation**

Create `src/match/themes.ts`:

```ts
import type { PlayerIndex } from './types'

export type ButtonStyle = 'filled' | 'outline'
export type WaitStyle = 'dim' | 'invert'
export type PanelState = 'active' | 'waiting' | 'neutral'

export interface HalfTheme {
  bg: string // panel background (active look)
  ink: string // clock / numbers / labels (active look)
  surface: string // -1 button fill (filled style)
  accent: string // +1 button fill (filled style)
  accentInk: string // +1 button text (filled style)
}

export interface Theme {
  id: string
  label: string
  buttons: ButtonStyle
  wait: WaitStyle
  warn: string
  danger: string
  /** Colour behind/between the panels; also the dim target for waiting halves. */
  backdrop: string
  /** The centre control strip (pause / settings). */
  chrome: { bg: string; ink: string }
  players: [HalfTheme, HalfTheme]
}

const DARK_CHROME = { bg: '#171717', ink: '#e5e5e5' }
const DARK_BACKDROP = '#171717'
const AMBER = '#fbbf24'
const RED = '#ef4444'
const DEEP_AMBER = '#b45309' // legible warning on white / parchment

export const THEMES: Theme[] = [
  {
    id: 'naruto',
    label: 'Naruto',
    buttons: 'filled',
    wait: 'dim',
    warn: AMBER,
    danger: RED,
    backdrop: DARK_BACKDROP,
    chrome: DARK_CHROME,
    players: [
      { bg: '#5b1418', ink: '#f59e42', surface: '#7a1c22', accent: '#f59e42', accentInk: '#3a0c0e' },
      { bg: '#16306b', ink: '#7fd4f5', surface: '#1e3f86', accent: '#7fd4f5', accentInk: '#0a1f44' },
    ],
  },
  {
    id: 'mono',
    label: 'Monochrome',
    buttons: 'outline',
    wait: 'invert',
    warn: DEEP_AMBER,
    danger: RED,
    backdrop: '#000000',
    chrome: { bg: '#000000', ink: '#ffffff' },
    players: [
      { bg: '#ffffff', ink: '#000000', surface: '#ffffff', accent: '#ffffff', accentInk: '#000000' },
      { bg: '#ffffff', ink: '#000000', surface: '#ffffff', accent: '#ffffff', accentInk: '#000000' },
    ],
  },
  {
    id: 'kurama',
    label: 'Kurama',
    buttons: 'filled',
    wait: 'dim',
    warn: AMBER,
    danger: RED,
    backdrop: DARK_BACKDROP,
    chrome: DARK_CHROME,
    players: [
      { bg: '#7a2e0a', ink: '#ffd27a', surface: '#9a3f10', accent: '#ffb347', accentInk: '#3a1500' },
      { bg: '#2e1a5c', ink: '#c9a8ff', surface: '#3d2470', accent: '#a06cff', accentInk: '#1a0d33' },
    ],
  },
  {
    id: 'scroll',
    label: 'Forbidden Scroll',
    buttons: 'filled',
    wait: 'dim',
    warn: DEEP_AMBER,
    danger: RED,
    backdrop: '#cabf9e',
    chrome: { bg: '#cabf9e', ink: '#2a2018' },
    players: [
      { bg: '#e9dcc0', ink: '#2a2018', surface: '#d8c6a0', accent: '#b0362f', accentInk: '#fbe7d2' },
      { bg: '#ded0b0', ink: '#2a2018', surface: '#cdbb95', accent: '#2f5d8a', accentInk: '#eef3f8' },
    ],
  },
  {
    id: 'konoha',
    label: 'Konoha',
    buttons: 'filled',
    wait: 'dim',
    warn: AMBER,
    danger: RED,
    backdrop: DARK_BACKDROP,
    chrome: DARK_CHROME,
    players: [
      { bg: '#143a26', ink: '#8fe3ab', surface: '#1d5236', accent: '#4fc27e', accentInk: '#06200f' },
      { bg: '#3d2c18', ink: '#e3c08f', surface: '#56401f', accent: '#c2944f', accentInk: '#241806' },
    ],
  },
]

export const DEFAULT_THEME_ID = 'naruto'

export function getTheme(id: string | null): Theme {
  return THEMES.find((t) => t.id === id) ?? THEMES.find((t) => t.id === DEFAULT_THEME_ID)!
}

export type PanelVars = Record<string, string>

export function panelVars(theme: Theme, player: PlayerIndex, state: PanelState): PanelVars {
  const half = theme.players[player]

  // Resolve panel background + ink for the given state.
  let bg: string
  let ink: string
  if (theme.wait === 'invert') {
    // active = authored look; waiting/neutral = swapped (resting look)
    if (state === 'active') {
      bg = half.bg
      ink = half.ink
    } else {
      bg = half.ink
      ink = half.bg
    }
  } else {
    ink = half.ink
    bg = state === 'waiting' ? `color-mix(in srgb, ${half.bg} 35%, ${theme.backdrop})` : half.bg
  }

  const filled = theme.buttons === 'filled'
  const mutedInk = `color-mix(in srgb, ${ink} 55%, transparent)`

  return {
    '--player-bg': bg,
    '--player-accent': ink,
    '--btn-plus-fill': filled ? half.accent : 'transparent',
    '--btn-plus-ink': filled ? half.accentInk : ink,
    '--btn-plus-border': filled ? 'transparent' : ink,
    '--btn-minus-fill': filled ? half.surface : 'transparent',
    '--btn-minus-ink': filled ? ink : mutedInk,
    '--btn-minus-border': filled ? 'transparent' : mutedInk,
    '--clock-warn': theme.warn,
    '--clock-danger': theme.danger,
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/match/themes.test.ts`
Expected: PASS (all cases).

- [ ] **Step 5: Commit**

```bash
git add src/match/themes.ts src/match/themes.test.ts
git commit -m "Add theme registry and panelVars resolver"
```

---

## Task 2: Theme context + persistence

**Files:**
- Create: `src/match/ThemeContext.tsx`
- Test: `src/match/ThemeContext.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/match/ThemeContext.test.tsx`:

```tsx
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider, useTheme } from './ThemeContext'

beforeEach(() => localStorage.clear())

function Probe() {
  const { theme, setTheme } = useTheme()
  return (
    <>
      <span data-testid="id">{theme.id}</span>
      <button onClick={() => setTheme('mono')}>pick mono</button>
    </>
  )
}

describe('ThemeProvider', () => {
  it('defaults to naruto when nothing is stored', () => {
    render(<ThemeProvider><Probe /></ThemeProvider>)
    expect(screen.getByTestId('id').textContent).toBe('naruto')
  })

  it('loads a previously stored theme', () => {
    localStorage.setItem('mythos-theme-v1', 'konoha')
    render(<ThemeProvider><Probe /></ThemeProvider>)
    expect(screen.getByTestId('id').textContent).toBe('konoha')
  })

  it('falls back to default for an invalid stored id', () => {
    localStorage.setItem('mythos-theme-v1', 'bogus')
    render(<ThemeProvider><Probe /></ThemeProvider>)
    expect(screen.getByTestId('id').textContent).toBe('naruto')
  })

  it('persists the selected theme', async () => {
    render(<ThemeProvider><Probe /></ThemeProvider>)
    await userEvent.click(screen.getByText('pick mono'))
    expect(screen.getByTestId('id').textContent).toBe('mono')
    expect(localStorage.getItem('mythos-theme-v1')).toBe('mono')
  })

  it('useTheme returns the default theme when used without a provider', () => {
    render(<Probe />)
    expect(screen.getByTestId('id').textContent).toBe('naruto')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/match/ThemeContext.test.tsx`
Expected: FAIL — cannot resolve `./ThemeContext`.

- [ ] **Step 3: Write the implementation**

Create `src/match/ThemeContext.tsx`:

```tsx
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { getTheme, DEFAULT_THEME_ID, type Theme } from './themes'

const THEME_KEY = 'mythos-theme-v1'

interface ThemeContextValue {
  theme: Theme
  themeId: string
  setTheme: (id: string) => void
}

function loadThemeId(): string {
  try {
    return localStorage.getItem(THEME_KEY) ?? DEFAULT_THEME_ID
  } catch {
    return DEFAULT_THEME_ID
  }
}

// Default value means components used without a provider render the default
// theme rather than throwing — keeps existing component tests provider-free.
const ThemeContext = createContext<ThemeContextValue>({
  theme: getTheme(null),
  themeId: DEFAULT_THEME_ID,
  setTheme: () => {},
})

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeId, setThemeId] = useState<string>(loadThemeId)

  useEffect(() => {
    try {
      localStorage.setItem(THEME_KEY, themeId)
    } catch {
      // storage unavailable / quota — non-fatal
    }
  }, [themeId])

  const theme = getTheme(themeId)
  return (
    <ThemeContext.Provider value={{ theme, themeId: theme.id, setTheme: setThemeId }}>
      {children}
    </ThemeContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext)
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/match/ThemeContext.test.tsx`
Expected: PASS.

Note: `themeId` is normalised to `theme.id` in the context value, so an invalid stored id surfaces as `naruto` to consumers (covered by the "invalid stored id" test).

- [ ] **Step 5: Commit**

```bash
git add src/match/ThemeContext.tsx src/match/ThemeContext.test.tsx
git commit -m "Add ThemeProvider with localStorage persistence"
```

---

## Task 3: Wrap the app in ThemeProvider

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Update App.tsx**

Replace the contents of `src/App.tsx` with:

```tsx
import { HashRouter, Routes, Route } from 'react-router-dom'
import { MatchProvider } from '@/match/MatchContext'
import { ThemeProvider } from '@/match/ThemeContext'
import { MatchScreen } from '@/screens/MatchScreen'
import { SettingsScreen } from '@/screens/SettingsScreen'

export default function App() {
  return (
    <ThemeProvider>
      <MatchProvider>
        <HashRouter>
          <Routes>
            <Route path="/" element={<MatchScreen />} />
            <Route path="/settings" element={<SettingsScreen />} />
          </Routes>
        </HashRouter>
      </MatchProvider>
    </ThemeProvider>
  )
}
```

- [ ] **Step 2: Run the full suite to confirm nothing broke**

Run: `npm test`
Expected: PASS (existing `App.test.tsx` still renders).

- [ ] **Step 3: Commit**

```bash
git add src/App.tsx
git commit -m "Wrap app in ThemeProvider"
```

---

## Task 4: Migrate the panel var contract (PlayerPanel + StatTile + ClockDisplay + EdgePill + index.css)

This is one atomic change: `PlayerPanel` stops using the `.theme-pN` CSS classes and instead applies `panelVars()`; the consumer components switch to the new variable names. Do all edits, then run tests once.

**Files:**
- Modify: `src/components/PlayerPanel.tsx`
- Modify: `src/components/StatTile.tsx`
- Modify: `src/components/ClockDisplay.tsx`
- Modify: `src/components/EdgePill.tsx`
- Modify: `src/index.css`

- [ ] **Step 1: Update PlayerPanel.tsx**

Replace `src/components/PlayerPanel.tsx` with:

```tsx
import { useMatch, useNow } from '@/match/MatchContext'
import { useTheme } from '@/match/ThemeContext'
import { panelVars, type PanelState } from '@/match/themes'
import { liveClockMs, liveRoundMs } from '@/match/timing'
import type { PlayerIndex } from '@/match/types'
import { ClockDisplay } from './ClockDisplay'
import { StatTile } from './StatTile'
import { EdgePill } from './EdgePill'

export function PlayerPanel({ index, flipped }: { index: PlayerIndex; flipped: boolean }) {
  const { match, dispatch } = useMatch()
  const { theme } = useTheme()
  const roundMode = match.roundTimer.enabled
  const running = roundMode ? !match.paused : match.active === index && !match.paused
  const now = useNow(running)
  const player = match.players[index]
  const displayMs = roundMode ? liveRoundMs(match, now) : liveClockMs(match, index, now)
  const isActive = !roundMode && !match.paused && match.active === index
  const isWaiting = !roundMode && !match.paused && match.active != null && match.active !== index

  const state: PanelState = isActive ? 'active' : isWaiting ? 'waiting' : 'neutral'
  const vars = panelVars(theme, index, state)

  return (
    <div
      data-flipped={flipped}
      data-running={isActive}
      className="relative flex h-full flex-col overflow-hidden rounded-2xl transition-[background-color,box-shadow] duration-300 motion-reduce:transition-none"
      style={{
        ...vars,
        background: vars['--player-bg'],
        color: vars['--player-accent'],
        transform: flipped ? 'rotate(180deg)' : undefined,
        boxShadow: isActive ? 'inset 0 0 0 4px var(--player-accent)' : 'inset 0 0 0 0 transparent',
      }}
    >
      <div className="flex items-center justify-between px-4 pt-3">
        <span className="text-lg font-bold">{player.name}</span>
        <EdgePill active={match.edge === index} onToggle={() => dispatch({ type: 'SET_EDGE', player: index })} />
      </div>

      <button
        type="button"
        data-testid={`tap-surface-${index}`}
        aria-label={roundMode ? 'Shared round timer running' : match.active == null ? `Start ${player.name}'s clock` : `Pass clock from ${player.name}`}
        onClick={roundMode ? undefined : () => dispatch({ type: 'TAP_HALF', player: index, now: Date.now() })}
        disabled={roundMode}
        className="flex flex-1 items-center justify-center transition-transform duration-100 active:scale-95 disabled:cursor-default disabled:active:scale-100 motion-reduce:transition-none motion-reduce:active:scale-100"
      >
        <ClockDisplay ms={displayMs} timedOut={roundMode ? false : player.timedOut} />
      </button>

      <div className="grid grid-cols-2">
        <StatTile
          label="CHAKRA"
          value={player.chakra}
          onInc={() => dispatch({ type: 'ADJUST_CHAKRA', player: index, delta: 1 })}
          onDec={() => dispatch({ type: 'ADJUST_CHAKRA', player: index, delta: -1 })}
          onReset={() => dispatch({ type: 'RESET_CHAKRA', player: index })}
        />
        <StatTile
          label="MISSION"
          value={player.mission}
          onInc={() => dispatch({ type: 'ADJUST_MISSION', player: index, delta: 1 })}
          onDec={() => dispatch({ type: 'ADJUST_MISSION', player: index, delta: -1 })}
          onReset={() => dispatch({ type: 'RESET_MISSION', player: index })}
        />
      </div>
    </div>
  )
}
```

Notes: the `...vars` spread sets every `--btn-*` / `--clock-*` / `--player-*` custom property on the root so descendants inherit them. The explicit `background`/`color` keys keep the panel's own fill and ink. The previous `color-mix(... 30%, #171717)` waiting-dim and the `.theme-pN` class are gone — `panelVars()` now owns the waiting background.

- [ ] **Step 2: Update StatTile.tsx**

Replace the `return` block's two adjust buttons and the value div in `src/components/StatTile.tsx`. The full file becomes:

```tsx
import { useState } from 'react'
import { RotateCcw } from 'lucide-react'

interface StatTileProps {
  label: string
  value: number
  onInc: () => void
  onDec: () => void
  onReset?: () => void
}

export function StatTile({ label, value, onInc, onDec, onReset }: StatTileProps) {
  const [spinKey, setSpinKey] = useState(0)
  const handleReset = () => {
    setSpinKey((k) => k + 1)
    onReset?.()
  }

  return (
    <div className="flex flex-col items-center gap-2 p-3">
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold tracking-widest opacity-80">{label}</span>
        {onReset && (
          <button type="button" aria-label={`Reset ${label}`} onClick={handleReset}
            className="hover-lift rounded-full p-1 opacity-70 transition-transform duration-200 active:scale-90 active:opacity-100">
            <RotateCcw key={spinKey} size={16} className={spinKey > 0 ? 'reset-spin' : undefined} />
          </button>
        )}
      </div>
      <div key={value} className="value-pop text-4xl font-bold tabular-nums" style={{ color: 'var(--player-accent)' }}>{value}</div>
      <div className="flex w-full gap-2">
        <button type="button" aria-label="-1" onClick={onDec} disabled={value <= 0}
          className="hover-lift flex-1 rounded-lg border-2 py-3 text-lg font-bold active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100"
          style={{ background: 'var(--btn-minus-fill)', borderColor: 'var(--btn-minus-border)', color: 'var(--btn-minus-ink)' }}>-1</button>
        <button type="button" aria-label="+1" onClick={onInc}
          className="hover-lift flex-1 rounded-lg border-2 py-3 text-lg font-bold active:scale-95"
          style={{ background: 'var(--btn-plus-fill)', borderColor: 'var(--btn-plus-border)', color: 'var(--btn-plus-ink)' }}>+1</button>
      </div>
    </div>
  )
}
```

Notes: both buttons gain `border-2`; filled themes set the border to `transparent` (invisible, no layout shift since border width is constant), outline themes set it to the ink colour.

- [ ] **Step 3: Update ClockDisplay.tsx**

Replace `src/components/ClockDisplay.tsx` with:

```tsx
import { formatMs } from '@/match/format'
import { WARN_MS, DANGER_MS } from '@/match/constants'

export function ClockDisplay({ ms, timedOut }: { ms: number; timedOut: boolean }) {
  const danger = timedOut || ms <= DANGER_MS
  const warn = !danger && ms <= WARN_MS
  const level = danger ? 'danger' : warn ? 'warn' : 'normal'
  return (
    <div
      data-testid="clock"
      data-timedout={timedOut}
      data-level={level}
      className={`text-center font-mono font-bold tabular-nums leading-none transition-colors duration-300 ${danger ? 'animate-pulse' : ''}`}
      style={{
        fontSize: 'clamp(3rem, 14vw, 6rem)',
        color: danger
          ? 'var(--clock-danger, #ef4444)'
          : warn
            ? 'var(--clock-warn, #fbbf24)'
            : 'var(--player-accent)',
      }}
    >
      {formatMs(ms)}
    </div>
  )
}
```

Notes: the literal fallbacks (`#ef4444`/`#fbbf24`) mean a `ClockDisplay` rendered outside a panel (e.g. its own unit test) still shows the original colours.

- [ ] **Step 4: Update EdgePill.tsx**

Replace `src/components/EdgePill.tsx` with:

```tsx
export function EdgePill({ active, onToggle }: { active: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      aria-label="Edge"
      data-active={active}
      onClick={onToggle}
      className="hover-lift rounded-full border-2 px-5 py-1.5 text-sm font-bold transition-[transform,background-color,border-color,color] duration-200 active:scale-95"
      style={
        active
          ? { background: 'var(--player-accent)', color: 'var(--player-bg)', borderColor: 'var(--player-accent)' }
          : { background: 'transparent', color: 'var(--player-accent)', borderColor: 'var(--player-accent)' }
      }
    >
      Edge
    </button>
  )
}
```

Notes: active text colour switches from the removed `--player-accent-fg` to `--player-bg` (the panel colour), which reads correctly in every theme — including Monochrome, where the active pill becomes ink-on-panel.

- [ ] **Step 5: Remove the old theme classes from index.css**

In `src/index.css`, delete these two lines (the `/* Per-player theme tokens ... */` comment on line 9 and the two class definitions on lines 10-11):

```css
/* Per-player theme tokens (consumed via inline style or data attributes) */
.theme-p1 { --player-bg: #5b1418; --player-surface: #7a1c22; --player-accent: #f59e42; --player-accent-fg: #3a0c0e; }
.theme-p2 { --player-bg: #16306b; --player-surface: #1e3f86; --player-accent: #7fd4f5; --player-accent-fg: #0a1f44; }
```

Leave every other rule in the file untouched.

- [ ] **Step 6: Run the affected tests**

Run: `npx vitest run src/components/PlayerPanel.test.tsx src/components/StatTile.test.tsx src/components/ClockDisplay.test.tsx src/components/EdgePill.test.tsx`
Expected: PASS. (These assert behaviour/roles/`data-*` attributes, not colour values, so they pass unchanged.)

- [ ] **Step 7: Run the full suite**

Run: `npm test`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/components/PlayerPanel.tsx src/components/StatTile.tsx src/components/ClockDisplay.tsx src/components/EdgePill.tsx src/index.css
git commit -m "Drive player panels from the theme registry"
```

---

## Task 5: Theme the centre strip and match backdrop

**Files:**
- Modify: `src/components/CenterBand.tsx`
- Modify: `src/screens/MatchScreen.tsx`

- [ ] **Step 1: Update CenterBand.tsx**

Replace `src/components/CenterBand.tsx` with:

```tsx
import { Link } from 'react-router-dom'
import { Pause, Play, Settings } from 'lucide-react'
import { useMatch } from '@/match/MatchContext'
import { useTheme } from '@/match/ThemeContext'

export function CenterBand({ vertical = false }: { vertical?: boolean }) {
  const { match, dispatch } = useMatch()
  const { theme } = useTheme()
  const chrome = { backgroundColor: theme.chrome.bg, color: theme.chrome.ink }
  const buttonBg = `color-mix(in srgb, ${theme.chrome.ink} 18%, ${theme.chrome.bg})`

  const toggle = () =>
    match.paused
      ? dispatch({ type: 'RESUME', now: Date.now() })
      : dispatch({ type: 'PAUSE', now: Date.now() })

  // In chess-clock mode the match starts by tapping a side, so before any clock
  // is active the centre play button does nothing. Show a start hint instead.
  const idle = !match.roundTimer.enabled && match.active == null

  const control = idle ? (
    <span
      className="text-xs font-medium uppercase tracking-wide opacity-60"
      style={vertical ? { writingMode: 'vertical-rl' } : undefined}
    >
      Tap a side to start
    </span>
  ) : (
    <button type="button" aria-label={match.paused ? 'Resume' : 'Pause'} onClick={toggle}
      className="hover-lift rounded-full p-2 active:scale-95" style={{ backgroundColor: buttonBg }}>
      {match.paused ? <Play size={20} /> : <Pause size={20} />}
    </button>
  )

  // Vertical: a thin strip between the two columns (settings on top, the
  // pause/start control centred below it). Horizontal: the original band.
  if (vertical) {
    return (
      <div className="flex min-w-11 flex-col items-center gap-4 px-1 py-4" style={chrome}>
        <Link to="/settings" aria-label="Settings" className="hover-lift rounded-lg p-2"><Settings size={20} /></Link>
        <div className="flex flex-1 items-center">{control}</div>
      </div>
    )
  }

  return (
    <div className="flex min-h-11 items-center justify-between gap-4 px-4" style={chrome}>
      <span className="w-10" />
      {control}
      <Link to="/settings" aria-label="Settings" className="hover-lift flex items-center self-stretch rounded-lg px-3"><Settings size={20} /></Link>
    </div>
  )
}
```

Notes: hardcoded `bg-neutral-900` / `text-neutral-200` / `bg-neutral-700` / `text-neutral-400` are replaced by the theme's `chrome` colours; the pause button uses an 18% ink-over-bg mix so it stands out in every theme.

- [ ] **Step 2: Update MatchScreen.tsx**

In `src/screens/MatchScreen.tsx`, import `useTheme` and replace the `bg-neutral-900` class on the outer div with an inline backdrop colour. The file becomes:

```tsx
import { PlayerPanel } from '@/components/PlayerPanel'
import { CenterBand } from '@/components/CenterBand'
import { useMatch } from '@/match/MatchContext'
import { useTheme } from '@/match/ThemeContext'
import { useWakeLock } from '@/hooks/useWakeLock'
import { useSplitLayout } from '@/hooks/useSplitLayout'

export function MatchScreen() {
  const { match } = useMatch()
  const { theme } = useTheme()
  const split = useSplitLayout()
  useWakeLock(!match.paused && (match.active != null || match.roundTimer.enabled))
  return (
    <div
      className={`flex h-full gap-1 ${split ? 'flex-row' : 'flex-col'}`}
      style={{
        backgroundColor: theme.backdrop,
        // 4px frame, expanded to the device safe-area insets (iOS home indicator
        // and rounded display corners). env() is 0 on Android/desktop.
        paddingTop: 'max(4px, env(safe-area-inset-top))',
        paddingRight: 'max(4px, env(safe-area-inset-right))',
        paddingBottom: 'max(4px, env(safe-area-inset-bottom))',
        paddingLeft: 'max(4px, env(safe-area-inset-left))',
      }}
    >
      {/* Portrait stacks the halves face-to-face (P1 flipped 180). Split landscape
          puts them side-by-side, both upright, so the device can sit any way up. */}
      <div className="min-h-0 min-w-0 flex-1"><PlayerPanel index={1} flipped={!split} /></div>
      <CenterBand vertical={split} />
      <div className="min-h-0 min-w-0 flex-1"><PlayerPanel index={0} flipped={false} /></div>
    </div>
  )
}
```

- [ ] **Step 3: Run the affected tests**

Run: `npx vitest run src/components/CenterBand.test.tsx src/screens/MatchScreen.test.tsx`
Expected: PASS. (`CenterBand.test.tsx` renders without a `ThemeProvider`; `useTheme` returns the default theme, so the pause/resume/settings behaviour is unchanged.)

- [ ] **Step 4: Commit**

```bash
git add src/components/CenterBand.tsx src/screens/MatchScreen.tsx
git commit -m "Theme the centre strip and match backdrop"
```

---

## Task 6: Appearance picker in Settings

**Files:**
- Modify: `src/screens/SettingsScreen.tsx`
- Modify: `src/screens/SettingsScreen.test.tsx`

- [ ] **Step 1: Write the failing test**

Add this `it` block inside the existing `describe('SettingsScreen', ...)` in `src/screens/SettingsScreen.test.tsx`. Also add the imports at the top.

Add to imports:

```tsx
import { ThemeProvider, useTheme } from '@/match/ThemeContext'
```

Add this probe component near `StartProbe`:

```tsx
function ThemeProbe() {
  const { theme } = useTheme()
  return <span data-testid="theme">{theme.id}</span>
}
```

Add this test:

```tsx
it('selects a theme from the appearance picker', async () => {
  localStorage.clear()
  render(
    <MemoryRouter>
      <ThemeProvider>
        <MatchProvider><SettingsScreen /><ThemeProbe /></MatchProvider>
      </ThemeProvider>
    </MemoryRouter>,
  )
  expect(screen.getByTestId('theme').textContent).toBe('naruto')
  await userEvent.click(screen.getByRole('radio', { name: /monochrome/i }))
  expect(screen.getByTestId('theme').textContent).toBe('mono')
  expect(localStorage.getItem('mythos-theme-v1')).toBe('mono')
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/screens/SettingsScreen.test.tsx`
Expected: FAIL — no radio named "Monochrome".

- [ ] **Step 3: Implement the Appearance section**

In `src/screens/SettingsScreen.tsx`:

Add imports near the existing ones:

```tsx
import { useTheme } from '@/match/ThemeContext'
import { THEMES } from '@/match/themes'
```

Inside the component, after the existing `useState` lines, add:

```tsx
  const { themeId, setTheme } = useTheme()
```

Add this section to the JSX, immediately before the `<Button variant="destructive" ...>New match</Button>` line:

```tsx
      <div className="space-y-2">
        <Label>Appearance</Label>
        <div role="radiogroup" aria-label="Theme" className="flex flex-col gap-2">
          {THEMES.map((t) => {
            const selected = t.id === themeId
            return (
              <button
                key={t.id}
                type="button"
                role="radio"
                aria-checked={selected}
                aria-label={t.label}
                onClick={() => setTheme(t.id)}
                className={`flex items-center justify-between rounded-lg border px-3 py-2 text-left transition-colors ${
                  selected ? 'border-slate-100 bg-slate-800' : 'border-slate-700 hover:bg-slate-800/60'
                }`}
              >
                <span className="font-medium">{t.label}</span>
                <span className="flex gap-1" aria-hidden="true">
                  <span className="h-5 w-5 rounded-full border border-black/20" style={{ background: t.players[0].bg }} />
                  <span className="h-5 w-5 rounded-full border border-black/20" style={{ background: t.players[1].bg }} />
                </span>
              </button>
            )
          })}
        </div>
      </div>
```

Notes: each row is a `role="radio"` button showing the theme label plus two swatches of the two players' base backgrounds; the selected row is outlined. Selecting calls `setTheme`, which the `ThemeProvider` persists.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/screens/SettingsScreen.test.tsx`
Expected: PASS (all cases — the new test and the three existing ones, which render without a `ThemeProvider` and therefore see the default theme).

- [ ] **Step 5: Commit**

```bash
git add src/screens/SettingsScreen.tsx src/screens/SettingsScreen.test.tsx
git commit -m "Add theme picker to Settings"
```

---

## Task 7: Full verification

- [ ] **Step 1: Run the whole suite**

Run: `npm test`
Expected: PASS, no skipped tests.

- [ ] **Step 2: Typecheck + lint + build**

Run: `npx tsc -b` then `npm run lint` then `npm run build`
Expected: no type errors, no lint errors, successful build. (Confirm the exact script names in `package.json`; adjust if `lint`/`build` differ.)

- [ ] **Step 3: Manual smoke check (use the run/verify skill or `npm run dev`)**

Verify in a browser:
- Settings shows five theme rows; the current one is outlined.
- Selecting **Monochrome**: the running player's half is white with black ink; the waiting half is black with white ink; +1/-1 and Edge are outline-only; the centre strip is black.
- Selecting **Forbidden Scroll**: panels are light parchment; the centre strip and the gap between panels are parchment-toned; the clock warning at ≤2:00 is a dark amber (legible), red at ≤0:30.
- Reload the page — the chosen theme persists.
- Press **New match** — the theme is unchanged (only the match resets).

- [ ] **Step 4: Final commit (if any tweaks were needed)**

```bash
git add -A
git commit -m "Finalize theme system"
```

---

## Self-review notes (resolved)

- **Spec coverage:** registry (Task 1), persistence + own key (Task 2), App wiring (Task 3), single mapping point + dumb consumers + index.css cleanup (Task 4), CenterBand + backdrop (Task 5), Settings picker + Settings stays dark (Task 6), per-theme warn/danger (Task 1 data + Task 4 ClockDisplay), verification (Task 7). All covered.
- **Refinement beyond the spec:** added `backdrop` to `Theme` (needed so the light Scroll theme dims waiting halves toward parchment, not black, and so `MatchScreen`'s gap matches) — `MatchScreen` added to the edit list accordingly.
- **Removed token:** `--player-accent-fg` is dropped; `EdgePill` now uses `--player-bg`. `--player-surface` is no longer emitted (folded into `--btn-minus-fill`).
- **Type consistency:** `panelVars(theme, player, state)`, `PanelState = 'active' | 'waiting' | 'neutral'`, and the `--btn-plus-*` / `--btn-minus-*` / `--clock-*` var names are used identically across Tasks 1, 4, and 6.
