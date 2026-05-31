import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MatchProvider, useMatch } from '@/match/MatchContext'
import { PlayerPanel } from './PlayerPanel'

beforeEach(() => localStorage.clear())

function ActiveProbe() {
  const { match } = useMatch()
  return <span data-testid="active">{String(match.active)}</span>
}

describe('PlayerPanel', () => {
  it('renders the player name and applies rotation when flipped', () => {
    const { container } = render(
      <MatchProvider><PlayerPanel index={0} flipped /></MatchProvider>,
    )
    expect(screen.getByText('Player 1')).toBeInTheDocument()
    expect(container.querySelector('[data-flipped="true"]')).not.toBeNull()
  })

  it('the first tap starts the tapped player', async () => {
    render(
      <MatchProvider>
        <PlayerPanel index={0} flipped={false} />
        <ActiveProbe />
      </MatchProvider>,
    )
    await userEvent.click(screen.getByTestId('tap-surface-0'))
    expect(screen.getByTestId('active').textContent).toBe('0')
  })

  it('disables tap-to-pass when the round timer is enabled', () => {
    localStorage.setItem('mythos-match-v1', JSON.stringify({
      players: [
        { name: 'Player 1', chakra: 5, mission: 0, clockMs: 900000, timedOut: false },
        { name: 'Player 2', chakra: 5, mission: 0, clockMs: 900000, timedOut: false },
      ],
      active: null, activeSince: null, edge: null, paused: true,
      roundTimer: { enabled: true, durationMs: 1500000, remainingMs: 1500000 }, roundSince: null,
      settings: { startMs: 900000 },
    }))
    render(<MatchProvider><PlayerPanel index={0} flipped={false} /></MatchProvider>)
    expect(screen.getByTestId('tap-surface-0')).toBeDisabled()
  })

  it('marks the panel as running when its clock is the active one', () => {
    localStorage.setItem('mythos-match-v1', JSON.stringify({
      players: [
        { name: 'Player 1', chakra: 5, mission: 0, clockMs: 900000, timedOut: false },
        { name: 'Player 2', chakra: 5, mission: 0, clockMs: 900000, timedOut: false },
      ],
      active: 0, activeSince: 1000, edge: null, paused: false,
      roundTimer: { enabled: false, durationMs: 1500000, remainingMs: 1500000 }, roundSince: null,
      settings: { startMs: 900000 },
    }))
    const { container } = render(
      <MatchProvider>
        <PlayerPanel index={0} flipped={false} />
        <PlayerPanel index={1} flipped />
      </MatchProvider>,
    )
    const panels = container.querySelectorAll('[data-running]')
    expect(panels[0]).toHaveAttribute('data-running', 'true')
    expect(panels[1]).toHaveAttribute('data-running', 'false')
  })

  it('applies the default theme palette as CSS variables on the panel root', () => {
    localStorage.setItem('mythos-match-v1', JSON.stringify({
      players: [
        { name: 'Player 1', chakra: 5, mission: 0, clockMs: 900000, timedOut: false },
        { name: 'Player 2', chakra: 5, mission: 0, clockMs: 900000, timedOut: false },
      ],
      active: 0, activeSince: 1000, edge: null, paused: false,
      roundTimer: { enabled: false, durationMs: 1500000, remainingMs: 1500000 }, roundSince: null,
      settings: { startMs: 900000 },
    }))
    const { container } = render(<MatchProvider><PlayerPanel index={0} flipped={false} /></MatchProvider>)
    const panel = container.querySelector('[data-running="true"]') as HTMLElement
    // No ThemeProvider here, so PlayerPanel resolves the default (naruto) palette.
    expect(panel.style.getPropertyValue('--player-bg')).toBe('#5b1418')
    expect(panel.style.getPropertyValue('--btn-plus-fill')).toBe('#f59e42')
  })
})
