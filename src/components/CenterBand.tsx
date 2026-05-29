import { Link } from 'react-router-dom'
import { Pause, Play, Settings } from 'lucide-react'
import { useMatch } from '@/match/MatchContext'

export function CenterBand() {
  const { match, dispatch } = useMatch()

  const toggle = () =>
    match.paused
      ? dispatch({ type: 'RESUME', now: Date.now() })
      : dispatch({ type: 'PAUSE', now: Date.now() })

  // In chess-clock mode the match starts by tapping a side, so before any clock
  // is active the centre play button does nothing. Show a start hint instead.
  const idle = !match.roundTimer.enabled && match.active == null

  return (
    <div className="flex items-center justify-between gap-4 bg-neutral-900 px-4 py-1 text-neutral-200">
      <span className="w-10" />
      {idle ? (
        <span className="text-xs font-medium uppercase tracking-wide text-neutral-400">Tap a side to start</span>
      ) : (
        <button aria-label={match.paused ? 'Resume' : 'Pause'} onClick={toggle} className="rounded-full bg-neutral-700 p-2 active:scale-95">
          {match.paused ? <Play size={20} /> : <Pause size={20} />}
        </button>
      )}
      <Link to="/settings" aria-label="Settings" className="p-2"><Settings size={20} /></Link>
    </div>
  )
}
