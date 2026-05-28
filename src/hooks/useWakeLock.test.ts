import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useWakeLock } from './useWakeLock'

const release = vi.fn(() => Promise.resolve())
const request = vi.fn(() => Promise.resolve({ release, addEventListener() {} }))

beforeEach(() => {
  release.mockClear(); request.mockClear()
  // @ts-expect-error test shim
  navigator.wakeLock = { request }
})

describe('useWakeLock', () => {
  it('requests a lock when active', async () => {
    renderHook(() => useWakeLock(true))
    await Promise.resolve()
    expect(request).toHaveBeenCalledWith('screen')
  })
  it('does not request when inactive', async () => {
    renderHook(() => useWakeLock(false))
    await Promise.resolve()
    expect(request).not.toHaveBeenCalled()
  })
})
