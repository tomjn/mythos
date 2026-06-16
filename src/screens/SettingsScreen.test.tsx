import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { MatchProvider, useMatch } from '@/match/MatchContext'
import { ThemeProvider, useTheme } from '@/match/ThemeContext'
import { SettingsScreen } from './SettingsScreen'

beforeEach(() => localStorage.clear())

function StartProbe() {
  const { match } = useMatch()
  return <span data-testid="start">{match.settings.startMs}</span>
}

function ThemeProbe() {
  const { theme } = useTheme()
  return <span data-testid="theme">{theme.id}</span>
}

describe('SettingsScreen', () => {
  it('enforces the 15-minute floor on start time', async () => {
    render(
      <MemoryRouter>
        <MatchProvider><SettingsScreen /><StartProbe /></MatchProvider>
      </MemoryRouter>,
    )
    const input = screen.getByLabelText(/minutes per player/i)
    await userEvent.clear(input)
    await userEvent.type(input, '10')
    await userEvent.click(screen.getByRole('button', { name: /apply time/i }))
    expect(screen.getByTestId('start').textContent).toBe(String(15 * 60 * 1000))
  })

  it('toggles the round timer', async () => {
    render(
      <MemoryRouter>
        <MatchProvider><SettingsScreen /></MatchProvider>
      </MemoryRouter>,
    )
    const sw = screen.getByRole('switch', { name: /round timer/i })
    await userEvent.click(sw)
    expect(sw).toBeChecked()
  })

  it('selects a theme from the appearance picker', async () => {
    localStorage.clear()
    render(
      <MemoryRouter>
        <ThemeProvider>
          <MatchProvider><SettingsScreen /><ThemeProbe /></MatchProvider>
        </ThemeProvider>
      </MemoryRouter>,
    )
    expect(screen.getByTestId('theme').textContent).toBe('naruto')
    await userEvent.click(screen.getByRole('radio', { name: /monochrome/i }))
    expect(screen.getByTestId('theme').textContent).toBe('mono')
    expect(localStorage.getItem('mythos-theme-v1')).toBe('mono')
  })

  // jsdom never fires animationend, so (matching the MatchScreen test) we assert the
  // exit fade is applied and navigation is deferred until it finishes.
  it('plays the exit fade and defers navigation when New match is pressed', async () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/settings']}>
        <MatchProvider>
          <Routes>
            <Route path="/" element={<div>match screen</div>} />
            <Route path="/settings" element={<SettingsScreen />} />
          </Routes>
        </MatchProvider>
      </MemoryRouter>,
    )
    await userEvent.click(screen.getByRole('button', { name: /new match/i }))
    expect(container.querySelector('.page-out')).not.toBeNull()
    expect(screen.queryByText('match screen')).toBeNull()
  })

  it('plays the exit fade and defers navigation when the back arrow is tapped', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/settings']}>
        <MatchProvider>
          <Routes>
            <Route path="/" element={<div>match screen</div>} />
            <Route path="/settings" element={<SettingsScreen />} />
          </Routes>
        </MatchProvider>
      </MemoryRouter>,
    )
    fireEvent.click(screen.getByLabelText('Back to match'))
    expect(container.querySelector('.page-out')).not.toBeNull()
    expect(screen.queryByText('match screen')).toBeNull()
  })
})
