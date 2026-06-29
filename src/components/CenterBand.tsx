import { useEffect, useState, type CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { Dices, Pause, Play, Settings } from 'lucide-react'
import { useMatch } from '@/match/MatchContext'
import { useTheme } from '@/match/ThemeContext'
import type { PlayerIndex } from '@/match/types'

// The result holds fully for HOLD_MS, then fades out quickly over FADE_MS and is
// removed at TOTAL_MS.
const DICE_HOLD_MS = 3_000
const DICE_FADE_MS = 1_500
const DICE_TOTAL_MS = DICE_HOLD_MS + DICE_FADE_MS
// How far each roll is nudged out of the bar toward its own player's panel.
const DICE_OFFSET_PX = 40

export function CenterBand({ vertical = false, onOpenSettings, animClass = '' }: { vertical?: boolean; onOpenSettings?: () => void; animClass?: string }) {
  const { match, dispatch } = useMatch()
  const { theme } = useTheme()
  const ninja = theme.displayFont ? 'font-ninja' : ''
  const chrome = { backgroundColor: theme.chrome.bg, color: theme.chrome.ink }
  const buttonBg = `color-mix(in srgb, ${theme.chrome.ink} 18%, ${theme.chrome.bg})`

  const toggle = () =>
    match.paused
      ? dispatch({ type: 'RESUME', now: Date.now() })
      : dispatch({ type: 'PAUSE', now: Date.now() })

  // Randomness lives here, not in the (pure) reducer — the reducer only decides
  // the winner from the supplied rolls. Each side rolls a d20 (1-20).
  const d20 = () => 1 + Math.floor(Math.random() * 20)
  const roll = () => dispatch({ type: 'ROLL_DICE', rolls: [d20(), d20()], now: Date.now() })

  // Visibility/fade are derived from the roll timestamp; the effect schedules the
  // two re-renders that drive it (start fading at HOLD, remove at TOTAL). Dice is
  // never persisted (see storage), so a reload can't bring an old roll back.
  const dice = match.dice
  const [, tick] = useState(0)
  useEffect(() => {
    if (!dice) return
    const elapsed = Date.now() - dice.at
    const bump = () => tick((n) => n + 1)
    const timers: ReturnType<typeof setTimeout>[] = []
    if (elapsed < DICE_HOLD_MS) timers.push(setTimeout(bump, DICE_HOLD_MS - elapsed))
    if (elapsed < DICE_TOTAL_MS) timers.push(setTimeout(bump, DICE_TOTAL_MS - elapsed))
    return () => timers.forEach(clearTimeout)
  }, [dice])
  // Reading the wall clock in render is intentional (the effect above re-renders us
  // at each threshold), mirroring useNow's impurity.
  // eslint-disable-next-line react-hooks/purity
  const elapsed = dice ? Date.now() - dice.at : 0
  const showDice = dice != null && elapsed < DICE_TOTAL_MS
  const dimmed = dice != null && elapsed >= DICE_HOLD_MS

  // In chess-clock mode the match starts by tapping a side, so before any clock
  // is active the centre play button does nothing. Show a start hint instead.
  const idle = !match.roundTimer.enabled && match.active == null

  // The dice are a who-goes-first tool, so the button only shows before play begins:
  // before a clock is tapped (chess) or the round timer is started/has run (round).
  const matchStarted =
    match.active != null ||
    match.roundSince != null ||
    match.roundTimer.remainingMs < match.roundTimer.durationMs

  const control = idle ? (
    <span
      className={`text-xs font-medium uppercase tracking-wide opacity-60 ${ninja}`}
      style={vertical ? { writingMode: 'vertical-rl' } : undefined}
    >
      Tap a side to start
    </span>
  ) : (
    <button type="button" aria-label={match.paused ? 'Resume' : 'Pause'} onClick={toggle}
      className={`hover-lift rounded-full p-2 active:scale-95 ${match.paused ? 'paused-pulse' : ''}`}
      style={{ backgroundColor: buttonBg, '--pulse': theme.chrome.ink } as CSSProperties}>
      {match.paused ? <Play size={20} /> : <Pause size={20} />}
    </button>
  )

  // Each roll sits in a box coloured with that player's palette so it's clear whose
  // it is; the higher value reads as the winner via size + a ring. The box is
  // absolutely positioned over the centre control (so it never changes the bar's
  // size) and nudged toward its own player — up/down in portrait, left/right in
  // landscape. The outer element owns the positioning, rotation (far player reads it
  // upright in portrait) and fade; the inner span owns the spin-in, so the two
  // transforms compose instead of clobbering each other.
  const renderRoll = (index: PlayerIndex, rotate: boolean) => {
    if (!dice) return null
    const half = theme.players[index]
    const isWinner = dice.winner === index
    const isTie = dice.winner === null
    // Fixed square per state (so a two-digit roll stays square, not a rectangle).
    const box = isTie ? 'h-16 w-16 text-4xl' : isWinner ? 'h-20 w-20 text-5xl' : 'h-12 w-12 text-2xl'
    // index 1 is the near-the-top / near-the-left player → negative offset.
    const dir = index === 1 ? -1 : 1
    const nudge = vertical ? `translateX(${dir * DICE_OFFSET_PX}px)` : `translateY(${dir * DICE_OFFSET_PX}px)`
    return (
      <div
        key={`${dice.rolls[0]}-${dice.rolls[1]}-${index}`}
        data-testid={`dice-${index}`}
        data-winner={String(isWinner)}
        data-rotated={String(rotate)}
        data-dimmed={String(dimmed)}
        aria-label={`${match.players[index].name} rolled ${dice.rolls[index]}${isWinner ? ', highest' : ''}`}
        className="pointer-events-none absolute left-1/2 top-1/2"
        style={{
          transform: `translate(-50%, -50%) ${nudge}${rotate ? ' rotate(180deg)' : ''}`,
          opacity: dimmed ? 0 : 1,
          transition: `opacity ${DICE_FADE_MS}ms linear`,
        }}
      >
        <span
          className={`dice-roll inline-flex items-center justify-center rounded-lg border-2 font-black tabular-nums leading-none ${box}`}
          style={{
            background: half.bg,
            color: half.ink,
            borderColor: half.ink,
            boxShadow: isWinner ? `0 0 0 3px ${half.ink}` : undefined,
            opacity: isWinner || isTie ? 1 : 0.6,
          }}
        >
          {dice.rolls[index]}
        </span>
      </div>
    )
  }

  // The result anchors on the dice button itself: a relative wrapper around the
  // button holds the two rolls, each absolutely positioned over it and nudged toward
  // its own player. Absolute positioning keeps the rolls out of flow, so a two-digit
  // result never resizes the bar.
  const diceTrigger = (buttonClass: string, wrapperClass = '') => (
    <div data-testid="dice-result" data-visible={String(showDice)} className={`relative ${wrapperClass}`}>
      <button type="button" aria-label="Roll dice" onClick={roll} className={buttonClass}>
        <Dices size={20} />
      </button>
      {renderRoll(1, !vertical)}
      {renderRoll(0, false)}
    </div>
  )

  // Vertical: a thin strip between the two columns (settings on top, the
  // pause/start control centred below it). Horizontal: the original band.
  if (vertical) {
    return (
      <div className={`relative z-10 flex min-w-11 flex-col items-center gap-4 px-1 py-4 ${animClass}`} style={chrome}>
        <Link to="/settings" aria-label="Settings" className="hover-lift rounded-lg p-2"
          onClick={(e) => { if (onOpenSettings) { e.preventDefault(); onOpenSettings() } }}><Settings size={20} /></Link>
        {!matchStarted && diceTrigger('hover-lift rounded-lg p-2 active:scale-95')}
        <div className="flex flex-1 items-center">{control}</div>
      </div>
    )
  }

  return (
    <div className={`relative z-10 flex min-h-11 items-center justify-between gap-4 px-4 ${animClass}`} style={chrome}>
      {/* Spacer keeps the control centred opposite Settings once the dice button is gone. */}
      {matchStarted ? <span className="w-10" /> : diceTrigger('hover-lift flex items-center self-stretch rounded-lg px-3 active:scale-95', 'flex self-stretch')}
      {control}
      <Link to="/settings" aria-label="Settings" className="hover-lift flex items-center self-stretch rounded-lg px-3"
        onClick={(e) => { if (onOpenSettings) { e.preventDefault(); onOpenSettings() } }}><Settings size={20} /></Link>
    </div>
  )
}
