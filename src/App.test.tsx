import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from './App'

beforeEach(() => localStorage.clear())

describe('App', () => {
  it('renders the match screen at the default route', () => {
    render(<App />)
    expect(screen.getByText('Player 1')).toBeInTheDocument()
  })
})
