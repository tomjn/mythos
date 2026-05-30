import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider, useTheme } from './ThemeContext'

beforeEach(() => localStorage.clear())

function Probe() {
  const { theme, setTheme } = useTheme()
  return (
    <>
      <span data-testid="id">{theme.id}</span>
      <button onClick={() => setTheme('mono')}>pick mono</button>
    </>
  )
}

describe('ThemeProvider', () => {
  it('defaults to naruto when nothing is stored', () => {
    render(<ThemeProvider><Probe /></ThemeProvider>)
    expect(screen.getByTestId('id').textContent).toBe('naruto')
  })

  it('loads a previously stored theme', () => {
    localStorage.setItem('mythos-theme-v1', 'konoha')
    render(<ThemeProvider><Probe /></ThemeProvider>)
    expect(screen.getByTestId('id').textContent).toBe('konoha')
  })

  it('falls back to default for an invalid stored id', () => {
    localStorage.setItem('mythos-theme-v1', 'bogus')
    render(<ThemeProvider><Probe /></ThemeProvider>)
    expect(screen.getByTestId('id').textContent).toBe('naruto')
  })

  it('persists the selected theme', async () => {
    render(<ThemeProvider><Probe /></ThemeProvider>)
    await userEvent.click(screen.getByText('pick mono'))
    expect(screen.getByTestId('id').textContent).toBe('mono')
    expect(localStorage.getItem('mythos-theme-v1')).toBe('mono')
  })

  it('useTheme returns the default theme when used without a provider', () => {
    render(<Probe />)
    expect(screen.getByTestId('id').textContent).toBe('naruto')
  })
})
