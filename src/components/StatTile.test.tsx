import { describe, it, expect, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StatTile } from './StatTile'
import { DELTA_WINDOW_MS } from '@/match/constants'

describe('StatTile', () => {
  it('renders label and value', () => {
    render(<StatTile label="CHAKRA" value={7} onInc={() => {}} onDec={() => {}} />)
    expect(screen.getByText('CHAKRA')).toBeInTheDocument()
    expect(screen.getByText('7')).toBeInTheDocument()
  })
  it('fires inc/dec/reset handlers', async () => {
    const onInc = vi.fn(), onDec = vi.fn(), onReset = vi.fn()
    render(<StatTile label="CHAKRA" value={7} onInc={onInc} onDec={onDec} onReset={onReset} />)
    await userEvent.click(screen.getByRole('button', { name: '+1' }))
    await userEvent.click(screen.getByRole('button', { name: '-1' }))
    await userEvent.click(screen.getByRole('button', { name: /reset/i }))
    expect(onInc).toHaveBeenCalledOnce()
    expect(onDec).toHaveBeenCalledOnce()
    expect(onReset).toHaveBeenCalledOnce()
  })
  it('omits reset when not provided', () => {
    render(<StatTile label="MISSION" value={13} onInc={() => {}} onDec={() => {}} />)
    expect(screen.queryByRole('button', { name: /reset/i })).toBeNull()
  })
  it('disables -1 at zero', () => {
    render(<StatTile label="MISSION" value={0} onInc={() => {}} onDec={() => {}} />)
    expect(screen.getByRole('button', { name: '-1' })).toBeDisabled()
  })
  it('enables -1 above zero', () => {
    render(<StatTile label="MISSION" value={3} onInc={() => {}} onDec={() => {}} />)
    expect(screen.getByRole('button', { name: '-1' })).toBeEnabled()
  })
  it('shows a reset as the change it made', async () => {
    render(<StatTile label="MISSION" value={9} onInc={() => {}} onDec={() => {}} onReset={() => {}} />)
    await userEvent.click(screen.getByRole('button', { name: /reset/i }))
    expect(screen.getByTestId('delta-MISSION').textContent).toBe('-9')
  })
  it('fires the +5 handler and shows it in the delta, and omits +5 when not provided', async () => {
    const onPlus5 = vi.fn()
    const { rerender } = render(<StatTile label="CHAKRA" value={5} onInc={() => {}} onDec={() => {}} onPlus5={onPlus5} />)
    await userEvent.click(screen.getByRole('button', { name: /\+5/ }))
    expect(onPlus5).toHaveBeenCalledOnce()
    expect(screen.getByTestId('delta-CHAKRA').textContent).toBe('+5')
    rerender(<StatTile label="CHAKRA" value={5} onInc={() => {}} onDec={() => {}} />)
    expect(screen.queryByRole('button', { name: /\+5/ })).toBeNull()
  })

  describe('live delta', () => {
    const tile = () => render(<StatTile label="CHAKRA" value={9} onInc={() => {}} onDec={() => {}} onPlus5={() => {}} />)
    const delta = () => screen.getByTestId('delta-CHAKRA')

    it('adds up taps, then fades after the quiet window and starts afresh', () => {
      vi.useFakeTimers()
      try {
        tile()
        expect(delta().dataset.visible).toBe('false')
        fireEvent.click(screen.getByRole('button', { name: '+1' }))
        fireEvent.click(screen.getByRole('button', { name: '+1' }))
        expect(delta().textContent).toBe('+2')
        expect(delta().dataset.visible).toBe('true')
        // A tap inside the window restarts the countdown.
        act(() => { vi.advanceTimersByTime(DELTA_WINDOW_MS - 1) })
        fireEvent.click(screen.getByRole('button', { name: '-1' }))
        act(() => { vi.advanceTimersByTime(DELTA_WINDOW_MS - 1) })
        expect(delta().textContent).toBe('+1')
        expect(delta().dataset.visible).toBe('true')
        act(() => { vi.advanceTimersByTime(1) })
        expect(delta().dataset.visible).toBe('false')
        fireEvent.click(screen.getByRole('button', { name: '-1' }))
        expect(delta().textContent).toBe('-1')
        expect(delta().dataset.visible).toBe('true')
      } finally {
        vi.useRealTimers()
      }
    })
  })
})
