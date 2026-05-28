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
