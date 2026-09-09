import { describe, expect, it } from 'vitest'
import { distanceMeters, formatDistance, toRad } from './geo'

describe('toRad', () => {
  it('converts degrees to radians', () => {
    expect(toRad(180)).toBeCloseTo(Math.PI)
    expect(toRad(0)).toBe(0)
    expect(toRad(90)).toBeCloseTo(Math.PI / 2)
  })
})

describe('distanceMeters', () => {
  it('is zero for identical points', () => {
    const point = { latitude: 37.7599, longitude: -122.4148 }
    expect(distanceMeters(point, point)).toBeCloseTo(0)
  })

  it('computes a known distance between two SF coordinates', () => {
    // Roughly 1.1 km apart (Ferry Building to Mission Dolores area).
    const a = { latitude: 37.7955, longitude: -122.3937 }
    const b = { latitude: 37.7749, longitude: -122.4194 }
    const distance = distanceMeters(a, b)
    expect(distance).toBeGreaterThan(2900)
    expect(distance).toBeLessThan(3300)
  })

  it('is symmetric', () => {
    const a = { latitude: 37.7599, longitude: -122.4148 }
    const b = { latitude: 37.7612, longitude: -122.4131 }
    expect(distanceMeters(a, b)).toBeCloseTo(distanceMeters(b, a))
  })
})

describe('formatDistance', () => {
  it('formats sub-kilometer distances in meters, rounded', () => {
    expect(formatDistance(0)).toBe('0 m')
    expect(formatDistance(42.4)).toBe('42 m')
    expect(formatDistance(999)).toBe('999 m')
  })

  it('formats distances of 1000m or more in kilometers with one decimal', () => {
    expect(formatDistance(1000)).toBe('1.0 km')
    expect(formatDistance(1500)).toBe('1.5 km')
    expect(formatDistance(12345)).toBe('12.3 km')
  })
})
