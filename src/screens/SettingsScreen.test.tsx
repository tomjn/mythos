import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { MatchProvider, useMatch } from '@/match/MatchContext'
import { SettingsScreen } from './SettingsScreen'

beforeEach(() => localStorage.clear())

function StartProbe() {
  const { match } = useMatch()
  return <span data-testid="start">{match.settings.startMs}</span>
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
})
