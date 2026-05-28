import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
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
    expect(screen.getByText('Player 1')).toBeInTheDocument()
    expect(screen.getByText('Player 2')).toBeInTheDocument()
    expect(screen.getByTestId('tap-surface-0')).toBeInTheDocument()
    expect(screen.getByTestId('tap-surface-1')).toBeInTheDocument()
  })
})
