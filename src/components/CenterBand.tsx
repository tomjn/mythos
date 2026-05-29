import { Link } from 'react-router-dom'
import { Pause, Play, Settings } from 'lucide-react'
import { useMatch } from '@/match/MatchContext'

export function CenterBand() {
  const { match, dispatch } = useMatch()

  const toggle = () =>
    match.paused
      ? dispatch({ type: 'RESUME', now: Date.now() })
      : dispatch({ type: 'PAUSE', now: Date.now() })

  return (
    <div className="flex items-center justify-between gap-4 bg-neutral-900 px-4 py-1 text-neutral-200">
      <span className="w-10" />
      <button aria-label={match.paused ? 'Resume' : 'Pause'} onClick={toggle} className="rounded-full bg-neutral-700 p-2 active:scale-95">
        {match.paused ? <Play size={20} /> : <Pause size={20} />}
      </button>
      <Link to="/settings" aria-label="Settings" className="p-2"><Settings size={20} /></Link>
    </div>
  )
}
