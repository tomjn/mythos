import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ShareCard } from './ShareCard'

describe('ShareCard', () => {
  it('renders a Share heading, a QR code, and the app link', () => {
    const { container } = render(<ShareCard />)
    expect(screen.getByRole('heading', { name: /share/i })).toBeInTheDocument()
    expect(container.querySelector('svg')).not.toBeNull()
    const link = screen.getByRole('link')
    expect(link.getAttribute('href')).toContain(window.location.origin)
  })
})
