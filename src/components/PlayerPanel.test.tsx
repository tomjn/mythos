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

  it('tapping the half passes the clock to the opponent', async () => {
    render(
      <MatchProvider>
        <PlayerPanel index={0} flipped={false} />
        <ActiveProbe />
      </MatchProvider>,
    )
    await userEvent.click(screen.getByTestId('tap-surface-0'))
    expect(screen.getByTestId('active').textContent).toBe('1')
  })
})
