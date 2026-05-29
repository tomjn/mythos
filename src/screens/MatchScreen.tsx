import { PlayerPanel } from '@/components/PlayerPanel'
import { CenterBand } from '@/components/CenterBand'
import { useMatch } from '@/match/MatchContext'
import { useWakeLock } from '@/hooks/useWakeLock'

export function MatchScreen() {
  const { match } = useMatch()
  useWakeLock(!match.paused && (match.active != null || match.roundTimer.enabled))
  return (
    <div
      className="flex h-full flex-col gap-1 bg-neutral-900"
      style={{
        // 4px frame, expanded to the device safe-area insets (iOS home indicator
        // and rounded display corners). env() is 0 on Android/desktop.
        paddingTop: 'max(4px, env(safe-area-inset-top))',
        paddingRight: 'max(4px, env(safe-area-inset-right))',
        paddingBottom: 'max(4px, env(safe-area-inset-bottom))',
        paddingLeft: 'max(4px, env(safe-area-inset-left))',
      }}
    >
      <div className="min-h-0 flex-1"><PlayerPanel index={1} flipped /></div>
      <CenterBand />
      <div className="min-h-0 flex-1"><PlayerPanel index={0} flipped={false} /></div>
    </div>
  )
}
