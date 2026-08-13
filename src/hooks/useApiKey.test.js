import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { useApiKey } from './useApiKey'

const STORAGE_KEY = 'straydar.anthropicApiKey'

beforeEach(() => {
  localStorage.clear()
})

describe('useApiKey', () => {
  it('starts empty when nothing is stored', () => {
    const { result } = renderHook(() => useApiKey())
    expect(result.current.apiKey).toBe('')
  })

  it('reads an existing key from localStorage on mount', () => {
    localStorage.setItem(STORAGE_KEY, 'sk-ant-existing')
    const { result } = renderHook(() => useApiKey())
    expect(result.current.apiKey).toBe('sk-ant-existing')
  })

  it('persists a new key to localStorage', () => {
    const { result } = renderHook(() => useApiKey())

    act(() => {
      result.current.setApiKey('sk-ant-new')
    })

    expect(result.current.apiKey).toBe('sk-ant-new')
    expect(localStorage.getItem(STORAGE_KEY)).toBe('sk-ant-new')
  })

  it('removes the key from localStorage when set to an empty value', () => {
    localStorage.setItem(STORAGE_KEY, 'sk-ant-existing')
    const { result } = renderHook(() => useApiKey())

    act(() => {
      result.current.setApiKey('')
    })

    expect(result.current.apiKey).toBe('')
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
  })
})
