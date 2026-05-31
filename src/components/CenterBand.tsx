import { Link } from 'react-router-dom'
import { Pause, Play, Settings } from 'lucide-react'
import { useMatch } from '@/match/MatchContext'
import { useTheme } from '@/match/ThemeContext'

export function CenterBand({ vertical = false, onOpenSettings, animClass = '' }: { vertical?: boolean; onOpenSettings?: () => void; animClass?: string }) {
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
      <div className={`flex min-w-11 flex-col items-center gap-4 px-1 py-4 ${animClass}`} style={chrome}>
        <Link to="/settings" aria-label="Settings" className="hover-lift rounded-lg p-2"
          onClick={(e) => { if (onOpenSettings) { e.preventDefault(); onOpenSettings() } }}><Settings size={20} /></Link>
        <div className="flex flex-1 items-center">{control}</div>
      </div>
    )
  }

  return (
    <div className={`flex min-h-11 items-center justify-between gap-4 px-4 ${animClass}`} style={chrome}>
      <span className="w-10" />
      {control}
      <Link to="/settings" aria-label="Settings" className="hover-lift flex items-center self-stretch rounded-lg px-3"
        onClick={(e) => { if (onOpenSettings) { e.preventDefault(); onOpenSettings() } }}><Settings size={20} /></Link>
    </div>
  )
}
