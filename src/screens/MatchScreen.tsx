import { PlayerPanel } from '@/components/PlayerPanel'
import { CenterBand } from '@/components/CenterBand'
import { useMatch } from '@/match/MatchContext'
import { useWakeLock } from '@/hooks/useWakeLock'

export function MatchScreen() {
  const { match } = useMatch()
  useWakeLock(!match.paused && (match.active != null || match.roundTimer.enabled))
  return (
    <div className="flex h-full flex-col">
      <div className="min-h-0 flex-1"><PlayerPanel index={1} flipped /></div>
      <CenterBand />
      <div className="min-h-0 flex-1"><PlayerPanel index={0} flipped={false} /></div>
    </div>
  )
}
