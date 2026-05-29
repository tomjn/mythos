import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { RotateNotice } from './RotateNotice'

describe('RotateNotice', () => {
  it('renders the rotate-to-portrait prompt', () => {
    render(<RotateNotice />)
    expect(screen.getByText(/rotate to portrait/i)).toBeInTheDocument()
  })
})
