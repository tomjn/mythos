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

// Perceived luminance of a #rrggbb colour; used to pick a contrasting flash.
function isLight(hex: string): boolean {
  const h = hex.replace('#', '')
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.55
}

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
      // waiting AND neutral use the swapped resting look
      bg = half.ink
      ink = half.bg
    }
  } else {
    ink = half.ink
    bg = state === 'waiting' ? `color-mix(in srgb, ${half.bg} 35%, ${theme.backdrop})` : half.bg // neutral falls through to full colour, same as active
  }

  const filled = theme.buttons === 'filled'
  const mutedInk = `color-mix(in srgb, ${ink} 55%, transparent)`
  // Counter-change pulse: a colour that contrasts the panel it sits on. `bg` is a
  // hex except for the filled-waiting dim (a color-mix) — fall back to the base bg.
  const bgHex = bg.startsWith('#') ? bg : half.bg

  return {
    '--player-bg': bg,
    '--player-accent': ink,
    '--value-flash': isLight(bgHex) ? '#000000' : '#ffffff',
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
