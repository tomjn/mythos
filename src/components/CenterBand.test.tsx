import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { MatchProvider, useMatch } from '@/match/MatchContext'
import { CenterBand } from './CenterBand'

beforeEach(() => localStorage.clear())

function Controls() {
  const { match, dispatch } = useMatch()
  return (
    <>
      <span data-testid="paused">{String(match.paused)}</span>
      <button onClick={() => dispatch({ type: 'TAP_HALF', player: 0, now: Date.now() })}>start</button>
    </>
  )
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
