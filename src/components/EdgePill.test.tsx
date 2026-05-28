import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { EdgePill } from './EdgePill'

describe('EdgePill', () => {
  it('reflects active state and fires onToggle', async () => {
    const onToggle = vi.fn()
    render(<EdgePill active onToggle={onToggle} />)
    const btn = screen.getByRole('button', { name: /edge/i })
    expect(btn).toHaveAttribute('data-active', 'true')
    await userEvent.click(btn)
    expect(onToggle).toHaveBeenCalledOnce()
  })
})
