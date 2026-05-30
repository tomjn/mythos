import { PlayerPanel } from '@/components/PlayerPanel'
import { CenterBand } from '@/components/CenterBand'
import { useMatch } from '@/match/MatchContext'
import { useWakeLock } from '@/hooks/useWakeLock'
import { useSplitLayout } from '@/hooks/useSplitLayout'

export function MatchScreen() {
  const { match } = useMatch()
  const split = useSplitLayout()
  useWakeLock(!match.paused && (match.active != null || match.roundTimer.enabled))
  return (
    <div
      className={`flex h-full gap-1 bg-neutral-900 ${split ? 'flex-row' : 'flex-col'}`}
      style={{
        // 4px frame, expanded to the device safe-area insets (iOS home indicator
        // and rounded display corners). env() is 0 on Android/desktop.
        paddingTop: 'max(4px, env(safe-area-inset-top))',
        paddingRight: 'max(4px, env(safe-area-inset-right))',
        paddingBottom: 'max(4px, env(safe-area-inset-bottom))',
        paddingLeft: 'max(4px, env(safe-area-inset-left))',
      }}
    >
      {/* Portrait stacks the halves face-to-face (P1 flipped 180). Split landscape
          puts them side-by-side, both upright, so the device can sit any way up. */}
      <div className="min-h-0 min-w-0 flex-1"><PlayerPanel index={1} flipped={!split} /></div>
      <CenterBand vertical={split} />
      <div className="min-h-0 min-w-0 flex-1"><PlayerPanel index={0} flipped={false} /></div>
    </div>
  )
}
