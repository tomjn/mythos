import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { MatchProvider, useMatch } from '@/match/MatchContext'
import { CenterBand } from './CenterBand'

beforeEach(() => localStorage.clear())

function seedDice(dice: unknown) {
  localStorage.setItem('mythos-match-v1', JSON.stringify({
    players: [
      { name: 'Player 1', chakra: 5, mission: 0, clockMs: 900000, timedOut: false },
      { name: 'Player 2', chakra: 5, mission: 0, clockMs: 900000, timedOut: false },
    ],
    active: null, activeSince: null, edge: null, paused: true,
    roundTimer: { enabled: false, durationMs: 1500000, remainingMs: 1500000 }, roundSince: null,
    settings: { startMs: 900000 }, dice,
  }))
}

const renderBand = (vertical = false) =>
  render(
    <MemoryRouter>
      <MatchProvider><CenterBand vertical={vertical} /></MatchProvider>
    </MemoryRouter>,
  )

function Controls() {
  const { match, dispatch } = useMatch()
  return (
    <>
      <span data-testid="paused">{String(match.paused)}</span>
      <button onClick={() => dispatch({ type: 'TAP_HALF', player: 0, now: Date.now() })}>start</button>
    </>
  )
}

function DiceProbe() {
  const { match } = useMatch()
  return <span data-testid="dice">{match.dice ? match.dice.rolls.join(',') : 'none'}</span>
}

describe('CenterBand', () => {
  it('pauses and resumes a running chess-clock match', async () => {
    render(
      <MemoryRouter>
        <MatchProvider>
          <CenterBand />
          <Controls />
        </MatchProvider>
      </MemoryRouter>,
    )
    await userEvent.click(screen.getByText('start'))
    expect(screen.getByTestId('paused').textContent).toBe('false')
    await userEvent.click(screen.getByRole('button', { name: /pause/i }))
    expect(screen.getByTestId('paused').textContent).toBe('true')
    await userEvent.click(screen.getByRole('button', { name: /resume/i }))
    expect(screen.getByTestId('paused').textContent).toBe('false')
  })

  it('always exposes a settings link', () => {
    render(
      <MemoryRouter>
        <MatchProvider><CenterBand /></MatchProvider>
      </MemoryRouter>,
    )
    expect(screen.getByRole('link', { name: /settings/i })).toBeInTheDocument()
  })

  it('shows a start hint instead of the play button before any clock starts', () => {
    render(
      <MemoryRouter>
        <MatchProvider><CenterBand /></MatchProvider>
      </MemoryRouter>,
    )
    expect(screen.getByText(/tap a side to start/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /resume|pause/i })).toBeNull()
  })

  it('rolls a d20 for each side when the dice button is tapped', async () => {
    render(
      <MemoryRouter>
        <MatchProvider>
          <CenterBand />
          <DiceProbe />
        </MatchProvider>
      </MemoryRouter>,
    )
    expect(screen.getByTestId('dice').textContent).toBe('none')
    await userEvent.click(screen.getByRole('button', { name: /roll dice/i }))
    const rolls = screen.getByTestId('dice').textContent!.split(',').map(Number)
    expect(rolls).toHaveLength(2)
    for (const r of rolls) {
      expect(r).toBeGreaterThanOrEqual(1)
      expect(r).toBeLessThanOrEqual(20)
    }
  })

  it('shows both rolls flanking the controls with the higher flagged as winner', () => {
    seedDice({ rolls: [7, 14], winner: 1, at: Date.now() })
    renderBand()
    expect(screen.getByTestId('dice-result')).toHaveAttribute('data-visible', 'true')
    expect(screen.getByTestId('dice-0').textContent).toBe('7')
    expect(screen.getByTestId('dice-1').textContent).toBe('14')
    expect(screen.getByTestId('dice-0')).toHaveAttribute('data-winner', 'false')
    expect(screen.getByTestId('dice-1')).toHaveAttribute('data-winner', 'true')
  })

  it('rotates the far player\'s number 180 in portrait so each faces its player', () => {
    seedDice({ rolls: [7, 14], winner: 1, at: Date.now() })
    renderBand(false)
    expect(screen.getByTestId('dice-1')).toHaveAttribute('data-rotated', 'true')
    expect(screen.getByTestId('dice-0')).toHaveAttribute('data-rotated', 'false')
  })

  it('does not rotate either number in split landscape (both upright)', () => {
    seedDice({ rolls: [7, 14], winner: 1, at: Date.now() })
    renderBand(true)
    expect(screen.getByTestId('dice-1')).toHaveAttribute('data-rotated', 'false')
    expect(screen.getByTestId('dice-0')).toHaveAttribute('data-rotated', 'false')
  })

  it('flags neither side on a tie', () => {
    seedDice({ rolls: [11, 11], winner: null, at: Date.now() })
    renderBand()
    expect(screen.getByTestId('dice-0')).toHaveAttribute('data-winner', 'false')
    expect(screen.getByTestId('dice-1')).toHaveAttribute('data-winner', 'false')
  })

  it('colours each roll box with its own player palette (the two differ)', () => {
    seedDice({ rolls: [7, 14], winner: 1, at: Date.now() })
    renderBand()
    const box0 = screen.getByTestId('dice-0').querySelector('span')!
    const box1 = screen.getByTestId('dice-1').querySelector('span')!
    expect(box0.style.background).not.toBe('')
    expect(box1.style.background).not.toBe('')
    expect(box0.style.background).not.toBe(box1.style.background)
  })

  it('nudges each number toward its own player in portrait (vertical offset)', () => {
    seedDice({ rolls: [7, 14], winner: 1, at: Date.now() })
    renderBand(false)
    expect(screen.getByTestId('dice-1').style.transform).toContain('translateY(-')
    const t0 = screen.getByTestId('dice-0').style.transform
    expect(t0).toContain('translateY(')
    expect(t0).not.toContain('translateY(-')
  })

  it('nudges each number toward its own player in landscape (horizontal offset)', () => {
    seedDice({ rolls: [7, 14], winner: 1, at: Date.now() })
    renderBand(true)
    expect(screen.getByTestId('dice-1').style.transform).toContain('translateX(-')
    const t0 = screen.getByTestId('dice-0').style.transform
    expect(t0).toContain('translateX(')
    expect(t0).not.toContain('translateX(-')
  })

  it('keeps the dice numbers out of layout flow so the bar size is stable', () => {
    seedDice({ rolls: [7, 14], winner: 1, at: Date.now() })
    renderBand(true)
    expect(screen.getByTestId('dice-0')).toHaveClass('absolute')
    expect(screen.getByTestId('dice-1')).toHaveClass('absolute')
  })

  it('shows the dice button before the match starts', () => {
    renderBand()
    expect(screen.getByRole('button', { name: /roll dice/i })).toBeInTheDocument()
  })

  it('hides the dice button once the match has started (a clock is active)', () => {
    localStorage.setItem('mythos-match-v1', JSON.stringify({
      players: [
        { name: 'Player 1', chakra: 5, mission: 0, clockMs: 900000, timedOut: false },
        { name: 'Player 2', chakra: 5, mission: 0, clockMs: 900000, timedOut: false },
      ],
      active: 0, activeSince: 1000, edge: null, paused: false,
      roundTimer: { enabled: false, durationMs: 1500000, remainingMs: 1500000 }, roundSince: null,
      settings: { startMs: 900000 }, dice: null,
    }))
    renderBand()
    expect(screen.queryByRole('button', { name: /roll dice/i })).toBeNull()
  })

  it('does not show a roll restored from storage that is already older than 10s', () => {
    seedDice({ rolls: [7, 14], winner: 1, at: Date.now() - 20_000 })
    renderBand()
    expect(screen.getByTestId('dice-result')).toHaveAttribute('data-visible', 'false')
  })

  it('holds the result, starts fading it after ~3s, then removes it once faded', () => {
    vi.useFakeTimers()
    vi.setSystemTime(0)
    try {
      seedDice({ rolls: [7, 14], winner: 1, at: 0 })
      renderBand()
      expect(screen.getByTestId('dice-1')).toHaveAttribute('data-dimmed', 'false')
      act(() => { vi.advanceTimersByTime(3_000) })
      expect(screen.getByTestId('dice-1')).toHaveAttribute('data-dimmed', 'true')
      expect(screen.getByTestId('dice-result')).toHaveAttribute('data-visible', 'true')
      act(() => { vi.advanceTimersByTime(1_500) })
      expect(screen.getByTestId('dice-result')).toHaveAttribute('data-visible', 'false')
    } finally {
      vi.useRealTimers()
    }
  })

  it('resume starts the shared round timer in round mode', async () => {
    localStorage.setItem('mythos-match-v1', JSON.stringify({
      players: [
        { name: 'Player 1', chakra: 5, mission: 0, clockMs: 900000, timedOut: false },
        { name: 'Player 2', chakra: 5, mission: 0, clockMs: 900000, timedOut: false },
      ],
      active: null, activeSince: null, edge: null, paused: true,
      roundTimer: { enabled: true, durationMs: 1500000, remainingMs: 1500000 }, roundSince: null,
      settings: { startMs: 900000 },
    }))
    render(
      <MemoryRouter>
        <MatchProvider>
          <CenterBand />
          <Controls />
        </MatchProvider>
      </MemoryRouter>,
    )
    expect(screen.getByTestId('paused').textContent).toBe('true')
    await userEvent.click(screen.getByRole('button', { name: /resume/i }))
    expect(screen.getByTestId('paused').textContent).toBe('false')
  })
})
