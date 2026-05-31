import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PlayerPanel } from '@/components/PlayerPanel'
import { CenterBand } from '@/components/CenterBand'
import { useMatch } from '@/match/MatchContext'
import { useTheme } from '@/match/ThemeContext'
import { useWakeLock } from '@/hooks/useWakeLock'
import { useSplitLayout } from '@/hooks/useSplitLayout'

export function MatchScreen() {
  const { match } = useMatch()
  const { theme } = useTheme()
  const split = useSplitLayout()
  const navigate = useNavigate()
  const [leaving, setLeaving] = useState(false)
  useWakeLock(!match.paused && (match.active != null || match.roundTimer.enabled))

  // The halves slide in from their outer edge on mount and reverse out when Settings
  // opens; the gear tap flips `leaving`, then this navigates once the exit finishes.
  const sideClass = leaving ? 'side-out' : 'side-in'
  const onAnimEnd = (e: React.AnimationEvent) => {
    if (leaving && e.animationName === 'side-out') navigate('/settings')
  }
  // A third of each half's size — it stays mostly on screen, so the fade reads softly
  // instead of completing while clipped off-slot.
  const p1Offset: Record<string, string> = split ? { '--side-from-x': '-33%' } : { '--side-from-y': '-33%' }
  const p2Offset: Record<string, string> = split ? { '--side-from-x': '33%' } : { '--side-from-y': '33%' }

  return (
    <div
      onAnimationEnd={onAnimEnd}
      className={`flex h-full gap-1 overflow-hidden ${split ? 'flex-row' : 'flex-col'}`}
      style={{
        backgroundColor: theme.backdrop,
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
      <div className={`min-h-0 min-w-0 flex-1 ${sideClass}`} style={{ ...p1Offset }}><PlayerPanel index={1} flipped={!split} /></div>
      <CenterBand vertical={split} onOpenSettings={() => setLeaving(true)} animClass={sideClass} />
      <div className={`min-h-0 min-w-0 flex-1 ${sideClass}`} style={{ ...p2Offset }}><PlayerPanel index={0} flipped={false} /></div>
    </div>
  )
}
