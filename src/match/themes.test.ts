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

  it('neutral half renders the same as active (full colour, no dim)', () => {
    const neutral = panelVars(naruto, 0, 'neutral')
    const active = panelVars(naruto, 0, 'active')
    expect(neutral['--player-bg']).toBe(active['--player-bg'])
    expect(neutral['--player-bg']).toBe('#5b1418')
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

  it('neutral half renders the swapped resting look (same as waiting)', () => {
    const neutral = panelVars(mono, 0, 'neutral')
    const waiting = panelVars(mono, 0, 'waiting')
    expect(neutral['--player-bg']).toBe(waiting['--player-bg'])
    expect(neutral['--player-bg']).toBe('#000000')
    expect(neutral['--player-accent']).toBe('#ffffff')
  })

  it('exposes the theme warn/danger colours', () => {
    const v = panelVars(mono, 0, 'active')
    expect(v['--clock-warn']).toBe('#b45309')
    expect(v['--clock-danger']).toBe('#ef4444')
  })
})
