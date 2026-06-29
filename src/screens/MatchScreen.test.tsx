import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { MatchProvider } from '@/match/MatchContext'
import { MatchScreen } from './MatchScreen'

beforeEach(() => localStorage.clear())

describe('MatchScreen', () => {
  it('renders both player panels', () => {
    render(
      <MemoryRouter>
        <MatchProvider><MatchScreen /></MatchProvider>
      </MemoryRouter>,
    )
    // Display-font themes badge the trailing number into its own span, splitting the
    // name across elements — match on each wrapper span's combined text.
    expect(screen.getByText((_, el) => el?.tagName === 'SPAN' && el?.textContent === 'Player 1')).toBeInTheDocument()
    expect(screen.getByText((_, el) => el?.tagName === 'SPAN' && el?.textContent === 'Player 2')).toBeInTheDocument()
    expect(screen.getByTestId('tap-surface-0')).toBeInTheDocument()
    expect(screen.getByTestId('tap-surface-1')).toBeInTheDocument()
  })

  it('animates the halves in on mount', () => {
    const { container } = render(
      <MemoryRouter>
        <MatchProvider><MatchScreen /></MatchProvider>
      </MemoryRouter>,
    )
    // The two player halves plus the centre band all animate in.
    expect(container.querySelectorAll('.side-in')).toHaveLength(3)
  })

  it('plays the exit animation and defers navigation when Settings is tapped', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/']}>
        <MatchProvider>
          <Routes>
            <Route path="/" element={<MatchScreen />} />
            <Route path="/settings" element={<div>settings route</div>} />
          </Routes>
        </MatchProvider>
      </MemoryRouter>,
    )
    fireEvent.click(screen.getByLabelText('Settings'))
    // The halves switch to the exit animation; navigation waits for it to finish
    // (jsdom never fires animationend), so we are still on the match screen.
    expect(container.querySelectorAll('.side-out')).toHaveLength(3)
    expect(screen.queryByText('settings route')).not.toBeInTheDocument()
  })
})
