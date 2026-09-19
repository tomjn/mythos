import { describe, it, expect } from 'vitest'
import { THEMES, DEFAULT_THEME_ID, getTheme, panelVars } from './themes'

describe('theme registry', () => {
  it('ships seven themes with unique ids', () => {
    expect(THEMES).toHaveLength(7)
    const ids = THEMES.map((t) => t.id)
    expect(new Set(ids).size).toBe(7)
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

  it('flags the display font on the Naruto-flavoured themes only', () => {
    const withFont = THEMES.filter((t) => t.displayFont).map((t) => t.id)
    expect(new Set(withFont)).toEqual(new Set(['naruto', 'kurama', 'gaara', 'scroll', 'konoha', 'tenchi']))
    expect(getTheme('mono').displayFont).toBeFalsy()
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

  it('resolves player index 1 from the correct palette slot', () => {
    const v = panelVars(naruto, 1, 'active')
    expect(v['--player-bg']).toBe('#16306b')
    expect(v['--player-accent']).toBe('#7fd4f5')
    expect(v['--btn-plus-fill']).toBe('#7fd4f5')
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

describe('panelVars value-flash (counter pulse colour)', () => {
  it('flashes white on dark panels and black on light panels', () => {
    expect(panelVars(getTheme('naruto'), 0, 'active')['--value-flash']).toBe('#ffffff')
    expect(panelVars(getTheme('scroll'), 0, 'active')['--value-flash']).toBe('#000000')
  })

  it('tracks the resolved background when the theme inverts (mono)', () => {
    const mono = getTheme('mono')
    expect(panelVars(mono, 0, 'active')['--value-flash']).toBe('#000000') // white panel
    expect(panelVars(mono, 0, 'neutral')['--value-flash']).toBe('#ffffff') // inverted to black panel
  })
})

describe('panelVars (Gaara: outlined buttons, per-side clock colours)', () => {
  const gaara = getTheme('gaara')

  it('outlines the filled buttons in black at the theme width', () => {
    const v = panelVars(gaara, 0, 'active')
    expect(v['--btn-plus-border']).toBe('#000000')
    expect(v['--btn-minus-border']).toBe('#000000')
    expect(v['--btn-border-width']).toBe('4px')
  })

  it('leaves other filled themes with no outline and the default width', () => {
    const v = panelVars(getTheme('naruto'), 0, 'active')
    expect(v['--btn-plus-border']).toBe('transparent')
    expect(v['--btn-border-width']).toBe('2px')
  })

  it('gives both sides the same black -1 and white +1 buttons', () => {
    for (const player of [0, 1] as const) {
      const v = panelVars(gaara, player, 'active')
      expect(v['--btn-minus-fill']).toBe('#000000')
      expect(v['--btn-minus-ink']).toBe('#ffffff')
      expect(v['--btn-plus-fill']).toBe('#ffffff')
      expect(v['--btn-plus-ink']).toBe('#432328')
    }
  })

  it("rings the active half in its own ring colour where set, else its ink", () => {
    expect(panelVars(gaara, 0, 'active')['--player-ring']).toBe('#432328')
    expect(panelVars(gaara, 1, 'active')['--player-ring']).toBe('#000000')
  })

  it("uses each side's own clock colours where set, else the theme's", () => {
    const red = panelVars(gaara, 0, 'active')
    const skin = panelVars(gaara, 1, 'active')
    expect(red['--clock-danger']).toBe('#fde047')
    expect(red['--clock-warn']).toBe(gaara.warn)
    expect(skin['--clock-danger']).toBe('#9a3a45')
    expect(skin['--clock-warn']).toBe('#b45309')
  })

  it('swaps a waiting half to its panel colour as ink when that reads better on the dim', () => {
    // Skin panel, black ink: black is 2.57:1 on the dimmed panel, the skin colour 6.31:1.
    const skin = panelVars(gaara, 1, 'waiting')
    expect(skin['--player-accent']).toBe('#fddcc9')
    expect(skin['--btn-minus-ink']).toBe('#ffffff') // the black -1 button keeps its own white text
    // Red panel, white ink: already the better of the two, so it stays.
    expect(panelVars(gaara, 0, 'waiting')['--player-accent']).toBe('#ffffff')
    // Active and neutral halves keep the authored ink.
    expect(panelVars(gaara, 1, 'active')['--player-accent']).toBe('#000000')
    expect(panelVars(gaara, 1, 'neutral')['--player-accent']).toBe('#000000')
  })
})
