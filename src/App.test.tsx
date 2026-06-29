import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from './App'

beforeEach(() => localStorage.clear())

describe('App', () => {
  it('renders the match screen at the default route', () => {
    render(<App />)
    // Display-font themes badge the trailing number into its own span, so the name
    // is split across elements — match on the containing span's full text.
    expect(screen.getByText((_, el) => el?.tagName === 'SPAN' && el?.textContent === 'Player 1')).toBeInTheDocument()
  })
})
