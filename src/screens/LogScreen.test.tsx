import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { MatchProvider } from '@/match/MatchContext'
import { createInitialMatch } from '@/match/state'
import { matchReducer } from '@/match/reducer'
import { saveMatch } from '@/match/storage'
import { LogScreen } from './LogScreen'

beforeEach(() => localStorage.clear())

const renderLog = () =>
  render(
    <MemoryRouter initialEntries={['/log']}>
      <MatchProvider>
        <Routes>
          <Route path="/" element={<div>match screen</div>} />
          <Route path="/log" element={<LogScreen />} />
        </Routes>
      </MatchProvider>
    </MemoryRouter>,
  )

describe('LogScreen', () => {
  it('says so when nothing has happened yet', () => {
    renderLog()
    expect(screen.getByText('No changes yet.')).toBeInTheDocument()
  })

  it('lists the match log newest first', () => {
    let m = matchReducer(createInitialMatch(), { type: 'TAP_HALF', player: 0, now: 1000 })
    m = matchReducer(m, { type: 'ADJUST_CHAKRA', player: 0, delta: 5, now: 2000 })
    saveMatch(m)
    renderLog()
    const items = screen.getAllByRole('listitem').map((li) => li.textContent)
    expect(items[0]).toContain('Player 1 added 5 chakra (5 to 10)')
    expect(items[1]).toContain("Player 1's clock started")
  })

  it("bolds each player's name", () => {
    saveMatch(matchReducer(createInitialMatch(), { type: 'ROLL_DICE', rolls: [7, 14], now: 1000 }))
    const { container } = renderLog()
    expect([...container.querySelectorAll('strong')].map((b) => b.textContent)).toEqual(['Player 1', 'Player 2'])
  })

  // jsdom never fires animationend, so (matching the Settings test) we assert the
  // exit fade is applied and navigation is deferred until it finishes.
  it('plays the exit fade and defers navigation when the back arrow is tapped', () => {
    const { container } = renderLog()
    fireEvent.click(screen.getByLabelText('Back to match'))
    expect(container.querySelector('.page-out')).not.toBeNull()
    expect(screen.queryByText('match screen')).toBeNull()
  })
})
