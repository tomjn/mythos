# Theme system — design

**Date:** 2026-05-31
**Status:** Approved, ready for implementation plan

## Goal

Add user-selectable colour themes, chosen in Settings and remembered across
sessions and matches. Ship five themes:

1. **Naruto** (default) — the current deep-red P1 / blue P2 palette, filled buttons.
2. **Monochrome** — active player = white panel / black ink, waiting player =
   black panel / white ink, every button text + outline (no fills).
3. **Kurama** — Nine-Tails fire orange (P1) vs Rinnegan violet (P2), filled.
4. **Forbidden Scroll** — aged-parchment light theme; crimson seal accent (P1),
   indigo seal accent (P2), filled.
5. **Konoha** — leaf-village forest green (P1) vs earth brown (P2), filled.

The current Naruto styling stays the default for first-time / unset users.

## Key design insight

Today's themes are **per-player palettes with filled buttons** (P1 red, P2
blue; accent stays constant, the waiting half just dims). Monochrome is
**per-state with outline buttons** — the background and ink *swap* between the
active (white) and waiting (black) halves.

These are two rendering models. Rather than scatter `if (monochrome)` branches,
`PlayerPanel` becomes the **single** place that maps
`(theme + active/waiting state) → CSS custom properties`. Every other component
(`StatTile`, `ClockDisplay`, `EdgePill`) stays a dumb consumer of those vars and
needs no knowledge of which theme is active. A sixth theme is then a data entry,
never a code change.

## Data model — `src/match/themes.ts` (new, pure data)

```ts
export type ButtonStyle = 'filled' | 'outline'
export type WaitStyle   = 'dim' | 'invert'

export interface HalfTheme {
  bg: string         // panel background (active state)
  ink: string        // text / clock / numbers / labels (active state)
  surface: string    // -1 button fill (filled style only)
  accent: string     // +1 button fill (filled style only)
  accentInk: string  // +1 button text  (filled style only)
}

export interface Theme {
  id: string                 // persisted key, e.g. 'naruto'
  label: string              // shown in Settings
  buttons: ButtonStyle
  wait: WaitStyle
  warn: string               // clock warning colour
  danger: string             // clock danger colour
  chrome: { bg: string; ink: string }  // CenterBand strip colours
  players: [HalfTheme, HalfTheme]
}

export const THEMES: Theme[] = [ /* naruto, mono, kurama, scroll, konoha */ ]
export const DEFAULT_THEME_ID = 'naruto'
export function getTheme(id: string | null): Theme  // falls back to default
```

- `wait: 'dim'` — waiting half: `bg` dims toward the backdrop (current
  `color-mix(... 30%, #171717)` behaviour), `ink`/buttons unchanged.
- `wait: 'invert'` — waiting half: swap `bg` ↔ `ink` (monochrome: active
  white→ black, waiting black→white).
- Waiting is *derived* from the active `HalfTheme`, so each theme is authored
  once (not 2 states × 2 players).

### Per-theme warn / danger

Dark themes keep amber (`#fbbf24`) / red (`#ef4444`). The white active panel in
**Monochrome** and the light **Forbidden Scroll** parchment use a darker amber
(e.g. `#b45309`) so the warning stays legible; red reads acceptably on both, so
danger stays red there.

## Persistence + access — `src/match/ThemeContext.tsx` (new)

`ThemeProvider` holds the selected theme `id`, persisted to its **own**
localStorage key `mythos-theme-v1` — separate from the match key
(`mythos-match-v1`) so `New match` never resets the theme. Reads on init with
fallback to `DEFAULT_THEME_ID`; writes on change (wrapped in try/catch like
`saveMatch`). `useTheme()` returns `{ theme: Theme, themeId, setTheme }`.
`App.tsx` wraps the existing tree (inside or alongside `MatchProvider`) in it.

## The single mapping point — `PlayerPanel.tsx`

Computes the effective half from `(theme, isActive, isWaiting)` and sets inline
CSS vars on its root element:

- `--player-bg` — panel background
- `--player-accent` — ink (clock, numbers, labels)
- `--btn-plus-fill`, `--btn-plus-border`, `--btn-plus-ink`
- `--btn-minus-fill`, `--btn-minus-border`, `--btn-minus-ink`
- `--clock-warn`, `--clock-danger`

Filled themes: button `fill` = accent/surface, `border` = transparent. Outline
themes: `fill` = transparent, `border` = ink. This removes the active-ring /
dim logic's dependence on the `.theme-p1/.theme-p2` CSS classes — those rules
are deleted from `index.css` and replaced by the typed registry.

## Dumb consumers (small edits)

- **`StatTile.tsx`** — `+1` / `-1` buttons always carry `border-2` and read
  `--btn-plus-* / --btn-minus-*`. No conditional JSX; filled vs outline is
  purely a difference in var values.
- **`EdgePill.tsx`** — already var-driven (filled when active, outline when
  inactive via `--player-accent`); verify it reads correctly under monochrome
  (active white panel → accent is black → filled pill is black-on-white).
- **`ClockDisplay.tsx`** — reads `--clock-warn` / `--clock-danger` (module
  constants `WARN_COLOR` / `DANGER_COLOR` become the CSS-var fallbacks).
- **`CenterBand.tsx`** — reads per-theme `chrome.bg` / `chrome.ink` (via
  `useTheme`) instead of hardcoded `neutral-900 / neutral-200`, so the
  pause/settings strip matches — important for Monochrome and the light Scroll
  theme.

## Settings UI — `SettingsScreen.tsx`

New **Appearance** section: the five themes as selectable rows, each with a
small dual-swatch preview (P1 / P2 colours) + label; the current selection is
marked, and choosing one applies it live (writes through `setTheme`).

The Settings screen itself **keeps its current dark-slate chrome** (out of
scope to re-theme its form inputs / handle `color-scheme` for the light theme).

## Out of scope

- Theming the Settings screen body.
- Custom / user-defined palettes.
- Light-mode form-control styling (`color-scheme`).

## Testing

- **`themes.ts`** — shape test: every theme has all required fields; ids unique;
  `DEFAULT_THEME_ID` resolves.
- **`ThemeContext`** — localStorage round-trip; unset → default; invalid id →
  default; `setTheme` persists.
- **`PlayerPanel.test.tsx`** — update: the contract changes from asserting the
  `theme-p1` class / fixed inline bg to asserting the computed CSS vars for a
  given theme + active/waiting state.
- **`SettingsScreen.test.tsx`** — add: selecting a theme row updates the
  persisted theme.
- Existing `ClockDisplay` / `StatTile` / `CenterBand` tests updated for the new
  var-driven styles where they assert specific colours.

## Files

New: `src/match/themes.ts`, `src/match/ThemeContext.tsx`.
Edit: `src/App.tsx`, `src/components/PlayerPanel.tsx`, `src/components/StatTile.tsx`,
`src/components/ClockDisplay.tsx`, `src/components/CenterBand.tsx`,
`src/components/EdgePill.tsx` (verify), `src/screens/SettingsScreen.tsx`,
`src/index.css` (remove `.theme-p1` / `.theme-p2`).
Tests as above.
