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
  it('is normal with plenty of time left', () => {
    render(<ClockDisplay ms={5 * 60 * 1000} timedOut={false} />)
    expect(screen.getByTestId('clock')).toHaveAttribute('data-level', 'normal')
  })
  it('warns at or under two minutes', () => {
    render(<ClockDisplay ms={90 * 1000} timedOut={false} />)
    expect(screen.getByTestId('clock')).toHaveAttribute('data-level', 'warn')
  })
  it('is in danger at or under thirty seconds', () => {
    render(<ClockDisplay ms={20 * 1000} timedOut={false} />)
    expect(screen.getByTestId('clock')).toHaveAttribute('data-level', 'danger')
  })
  it('fades on a cycle when paused', () => {
    render(<ClockDisplay ms={5 * 60 * 1000} timedOut={false} paused />)
    expect(screen.getByTestId('clock')).toHaveClass('paused-fade')
  })
  it('does not fade when not paused', () => {
    render(<ClockDisplay ms={5 * 60 * 1000} timedOut={false} />)
    expect(screen.getByTestId('clock')).not.toHaveClass('paused-fade')
  })
})
