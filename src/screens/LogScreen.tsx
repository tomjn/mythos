import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useMatch } from '@/match/MatchContext'
import { useTheme } from '@/match/ThemeContext'
import { formatLogEntry } from '@/match/format'
import { pageVars } from '@/match/themes'

export function LogScreen() {
  const { match } = useMatch()
  const navigate = useNavigate()
  const { theme } = useTheme()
  const ninja = theme.displayFont ? 'font-ninja' : ''

  // Player names are bold so it is quick to see who each entry is about.
  const names = match.players.map((p) => p.name)
  const boldNames = (text: string) =>
    text.split(new RegExp(`(${names.map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`)).map((part, i) =>
      names.includes(part) ? <strong key={i}>{part}</strong> : part,
    )

  // Same exit fade as Settings, so the backdrop colour change eases in.
  const [leaving, setLeaving] = useState(false)
  const onAnimEnd = (e: React.AnimationEvent) => {
    if (leaving && e.animationName === 'page-out') navigate('/')
  }

  return (
    <div
      onAnimationEnd={onAnimEnd}
      className={`${leaving ? 'page-out' : 'page-in'} flex min-h-full w-full flex-col gap-6 p-6`}
      style={{ ...pageVars(theme), backgroundColor: 'var(--page-bg)', color: 'var(--page-ink)' }}
    >
      <Link
        to="/"
        aria-label="Back to match"
        onClick={(e) => { e.preventDefault(); setLeaving(true) }}
        className="hover-lift -mx-2 flex items-center gap-3 self-start rounded-lg px-2 py-1"
      >
        <ArrowLeft />
        <h1 className={`text-xl font-bold ${ninja}`}>Match log</h1>
      </Link>

      {match.log.length === 0 ? (
        <p className="text-sm opacity-70">No changes yet.</p>
      ) : (
        <ol className="rounded-lg border border-[color:var(--page-line)] text-sm" reversed>
          {[...match.log].reverse().map((entry, i) => (
            <li key={match.log.length - i} className="flex gap-3 border-b border-[color:var(--page-line)] px-3 py-2 last:border-b-0">
              <time className="shrink-0 tabular-nums opacity-70" dateTime={new Date(entry.at).toISOString()}>
                {new Date(entry.at).toLocaleTimeString()}
              </time>
              <span>{boldNames(formatLogEntry(entry, match.players))}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
