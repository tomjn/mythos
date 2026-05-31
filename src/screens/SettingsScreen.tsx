import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useMatch } from '@/match/MatchContext'
import { useTheme } from '@/match/ThemeContext'
import { THEMES } from '@/match/themes'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { ShareCard } from '@/components/ShareCard'
import { MIN_START_MS } from '@/match/constants'

export function SettingsScreen() {
  const { match, dispatch } = useMatch()
  const navigate = useNavigate()
  const [minutes, setMinutes] = useState(String(Math.round(match.settings.startMs / 60000)))
  const [roundMinutes, setRoundMinutes] = useState(String(Math.round(match.roundTimer.durationMs / 60000)))
  const { themeId, setTheme } = useTheme()

  return (
    <div className="flex min-h-full w-full flex-col gap-6 bg-slate-900 p-6 text-slate-100">
      <div className="flex items-center gap-3">
        <Link to="/" aria-label="Back to match"><ArrowLeft /></Link>
        <h1 className="text-xl font-bold">Settings</h1>
        <Button variant="destructive" className="ml-auto" onClick={() => { dispatch({ type: 'NEW_MATCH' }); navigate('/') }}>New match</Button>
      </div>

      <div className="space-y-2">
        <Label htmlFor="start">Minutes per player (min 15)</Label>
        <div className="flex gap-4">
          <Input id="start" type="number" inputMode="numeric" min={15} value={minutes}
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
        <div className="flex gap-4">
          <Input id="roundlen" type="number" inputMode="numeric" min={1} value={roundMinutes}
            onChange={(e) => setRoundMinutes(e.target.value)} />
          <Button onClick={() => dispatch({ type: 'SET_ROUND_DURATION', ms: Math.max(1, Number(roundMinutes)) * 60000 })}>
            Apply round
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Theme</Label>
        <div className="flex flex-col gap-2">
          {THEMES.map((t) => {
            const selected = t.id === themeId
            return (
              <label
                key={t.id}
                className={`flex cursor-pointer items-center justify-between rounded-lg border px-3 py-2 transition-colors focus-within:ring-2 focus-within:ring-slate-100 ${
                  selected ? 'border-slate-100 bg-slate-800' : 'border-slate-700 hover:bg-slate-800/60'
                }`}
              >
                <span className="flex items-center gap-3">
                  <input type="radio" name="theme" value={t.id} checked={selected}
                    onChange={() => setTheme(t.id)} className="sr-only" />
                  <span className="font-medium">{t.label}</span>
                </span>
                <span className="flex gap-1" aria-hidden="true">
                  <span className="h-5 w-5 rounded-full border border-slate-500" style={{ background: t.players[0].bg }} />
                  <span className="h-5 w-5 rounded-full border border-slate-500" style={{ background: t.players[1].bg }} />
                </span>
              </label>
            )
          })}
        </div>
      </div>

      <ShareCard />

      <footer className="mt-auto border-t border-slate-700/60 pt-4 text-center text-sm text-slate-400">
        Found a bug or have a suggestion?{' '}
        <a
          href="https://github.com/tomjn/mythos/issues"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-slate-200 underline underline-offset-2 hover:text-white"
        >
          Open an issue on GitHub
        </a>
      </footer>
    </div>
  )
}
