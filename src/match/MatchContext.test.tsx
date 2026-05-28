import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MatchProvider, useMatch } from './MatchContext'

function Probe() {
  const { match, dispatch } = useMatch()
  return (
    <div>
      <span data-testid="edge">{String(match.edge)}</span>
      <button onClick={() => dispatch({ type: 'SET_EDGE', player: 0 })}>edge0</button>
    </div>
  )
}

beforeEach(() => localStorage.clear())

describe('MatchProvider', () => {
  it('provides state and dispatch, and persists changes', async () => {
    render(<MatchProvider><Probe /></MatchProvider>)
    expect(screen.getByTestId('edge').textContent).toBe('null')
    await userEvent.click(screen.getByText('edge0'))
    expect(screen.getByTestId('edge').textContent).toBe('0')
    expect(localStorage.getItem('mythos-match-v1')).toContain('"edge":0')
  })

  it('rehydrates from localStorage on mount', () => {
    const stored = JSON.stringify({
      players: [
        { name: 'A', chakra: 7, mission: 3, clockMs: 1, timedOut: false },
        { name: 'B', chakra: 5, mission: 0, clockMs: 1, timedOut: false },
      ],
      active: null, activeSince: null, edge: 1, paused: true,
      roundTimer: { enabled: false, durationMs: 1, remainingMs: 1 }, roundSince: null,
      settings: { startMs: 1800000 },
    })
    localStorage.setItem('mythos-match-v1', stored)
    render(<MatchProvider><Probe /></MatchProvider>)
    expect(screen.getByTestId('edge').textContent).toBe('1')
  })
})
