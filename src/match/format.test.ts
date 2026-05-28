import { describe, it, expect } from 'vitest'
import { formatMs } from './format'

describe('formatMs', () => {
  it('formats whole minutes and seconds', () => {
    expect(formatMs(30 * 60 * 1000)).toBe('30:00')
  })
  it('floors partial seconds', () => {
    expect(formatMs(4 * 60 * 1000 + 39_900)).toBe('04:39')
  })
  it('clamps negatives to 00:00', () => {
    expect(formatMs(-5000)).toBe('00:00')
  })
  it('pads single digits', () => {
    expect(formatMs(9000)).toBe('00:09')
  })
})
