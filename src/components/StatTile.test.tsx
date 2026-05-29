import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StatTile } from './StatTile'

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
})
