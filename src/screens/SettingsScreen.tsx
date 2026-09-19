import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useMatch } from '@/match/MatchContext'
import { useTheme } from '@/match/ThemeContext'
import { THEMES, pageVars } from '@/match/themes'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { ShareCard } from '@/components/ShareCard'
import { MIN_START_MS } from '@/match/constants'

export function SettingsScreen() {
  const { match, dispatch } = useMatch()
  const navigate = useNavigate()
  const [minutes, setMinutes] = useState(match.settings.startMs.map((ms) => String(Math.round(ms / 60000))))
  const setMinutesAt = (i: number, value: string) => setMinutes((prev) => prev.map((m, j) => (j === i ? value : m)))
  const toMs = (m: string) => Math.max(MIN_START_MS, Number(m) * 60000)
  const applyTime = () => dispatch({
    type: 'SET_START_TIME',
    ms: [toMs(minutes[0]), toMs(minutes[1])],
    now: Date.now(),
  })
  const [roundMinutes, setRoundMinutes] = useState(String(Math.round(match.roundTimer.durationMs / 60000)))
  const { theme, themeId, setTheme } = useTheme()
  const ninja = theme.displayFont ? 'font-ninja' : ''
  // The brush face crowds parentheses against their text, so pad them out — but only
  // on the display-font themes where that font is actually in use.
  // The shadcn controls take their colours from fixed tokens, so they are pointed at
  // the theme's page colours here.
  const field = 'border-[color:var(--page-line)] bg-[color:var(--page-field)]'
  const primary = 'bg-[color:var(--page-ink)] text-[color:var(--page-bg)] hover:bg-[color:var(--page-ink)] hover:opacity-90'
  const pad = (s: string) => (theme.displayFont ? s.replace(/\(/g, '( ').replace(/\)/g, ' )') : s)

  // Fade Settings out before returning to the match, so the backdrop colour change
  // eases in rather than cutting hard (most noticeable on the light themes).
  const [leaving, setLeaving] = useState(false)
  const leave = (before?: () => void) => { before?.(); setLeaving(true) }
  const onAnimEnd = (e: React.AnimationEvent) => {
    if (leaving && e.animationName === 'page-out') navigate('/')
  }

  return (
    <div
      onAnimationEnd={onAnimEnd}
      className={`${leaving ? 'page-out' : 'page-in'} flex min-h-full w-full flex-col gap-6 p-6`}
      style={{ ...pageVars(theme), backgroundColor: 'var(--page-bg)', color: 'var(--page-ink)' }}
    >
      <div className="flex items-center gap-3">
        <Link
          to="/"
          aria-label="Back to match"
          onClick={(e) => { e.preventDefault(); leave() }}
          className="hover-lift -mx-2 flex items-center gap-3 rounded-lg px-2 py-1"
        >
          <ArrowLeft />
          <h1 className={`text-xl font-bold ${ninja}`}>Settings</h1>
        </Link>
        <Button variant="destructive" className="ml-auto" onClick={() => leave(() => dispatch({ type: 'NEW_MATCH' }))}>New match</Button>
      </div>

      {/* One field per player, so a late player's clock can be docked. */}
      <fieldset className="space-y-2">
        <legend className={`mb-2 text-sm font-medium ${ninja}`}>{pad('Minutes per player (min 1)')}</legend>
        <div className="grid grid-cols-2 gap-4">
          {([0, 1] as const).map((i) => (
            <div key={i} className="space-y-2">
              <Label htmlFor={`start${i}`} className={ninja}>{match.players[i].name}</Label>
              <Input id={`start${i}`} className={field} type="number" inputMode="numeric" min={1} value={minutes[i]}
                onChange={(e) => setMinutesAt(i, e.target.value)} />
            </div>
          ))}
        </div>
        <Button className={`w-full ${primary}`} onClick={applyTime}>Apply time</Button>
      </fieldset>

      <div className="flex items-center justify-between">
        <Label htmlFor="round" className={ninja}>Shared round timer</Label>
        <Switch id="round" aria-label="Round timer" checked={match.roundTimer.enabled}
          onCheckedChange={() => dispatch({ type: 'TOGGLE_ROUND_TIMER', now: Date.now() })} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="roundlen" className={ninja}>{pad('Round length (minutes)')}</Label>
        <div className="flex gap-4">
          <Input id="roundlen" className={field} type="number" inputMode="numeric" min={1} value={roundMinutes}
            onChange={(e) => setRoundMinutes(e.target.value)} />
          <Button className={primary} onClick={() => dispatch({ type: 'SET_ROUND_DURATION', ms: Math.max(1, Number(roundMinutes)) * 60000, now: Date.now() })}>
            Apply round
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label className={ninja}>Theme</Label>
        <div className="flex flex-col gap-2">
          {THEMES.map((t) => {
            const selected = t.id === themeId
            return (
              <label
                key={t.id}
                className={`flex cursor-pointer items-center justify-between rounded-lg border px-3 py-2 transition-colors focus-within:ring-2 focus-within:ring-[color:var(--page-ink)] ${
                  selected ? 'border-[color:var(--page-ink)] bg-[color:var(--page-field)]' : 'border-[color:var(--page-line)] hover:bg-[color:var(--page-field)]'
                }`}
              >
                <span className="flex items-center gap-3">
                  <input type="radio" name="theme" value={t.id} checked={selected}
                    onChange={() => setTheme(t.id)} className="sr-only" />
                  <span className="font-medium">{t.label}</span>
                </span>
                <span className="flex gap-1" aria-hidden="true">
                  <span className="h-5 w-5 rounded-full border border-[color:var(--page-line)]" style={{ background: t.players[0].bg }} />
                  <span className="h-5 w-5 rounded-full border border-[color:var(--page-line)]" style={{ background: t.players[1].bg }} />
                </span>
              </label>
            )
          })}
        </div>
      </div>

      <ShareCard />

      <footer className="mt-auto border-t border-[color:var(--page-line)] pt-4 text-center text-sm">
        <span className="opacity-70">Found a bug or have a suggestion?</span>{' '}
        <a
          href="https://github.com/tomjn/mythos/issues"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium underline underline-offset-2 hover:opacity-80"
        >
          Open an issue on GitHub
        </a>
      </footer>
    </div>
  )
}
