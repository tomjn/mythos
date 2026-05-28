import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ClockDisplay } from './ClockDisplay'

describe('ClockDisplay', () => {
  it('renders formatted time', () => {
    render(<ClockDisplay ms={4 * 60 * 1000 + 39_000} timedOut={false} />)
    expect(screen.getByText('04:39')).toBeInTheDocument()
  })
  it('marks time-out state', () => {
    render(<ClockDisplay ms={0} timedOut />)
    expect(screen.getByTestId('clock')).toHaveAttribute('data-timedout', 'true')
  })
})
