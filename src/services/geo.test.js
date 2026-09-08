import { describe, expect, it } from 'vitest'
import { distanceMeters, formatDistance } from './geo'

describe('distanceMeters', () => {
  it('returns 0 for identical points', () => {
    const point = { latitude: 37.7599, longitude: -122.4148 }
    expect(distanceMeters(point, point)).toBe(0)
  })

  it('matches a known real-world distance within a few meters', () => {
    // ~1.3 km between these two SF landmarks (Ferry Building -> Coit Tower).
    const ferryBuilding = { latitude: 37.7955, longitude: -122.3937 }
    const coitTower = { latitude: 37.8024, longitude: -122.4058 }
    const distance = distanceMeters(ferryBuilding, coitTower)
    expect(distance).toBeGreaterThan(1250)
    expect(distance).toBeLessThan(1350)
  })

  it('is symmetric', () => {
    const a = { latitude: 37.7599, longitude: -122.4148 }
    const b = { latitude: 37.7621, longitude: -122.4139 }
    expect(distanceMeters(a, b)).toBeCloseTo(distanceMeters(b, a), 6)
  })
})

describe('formatDistance', () => {
  it('renders sub-kilometer distances in meters, rounded', () => {
    expect(formatDistance(42.4)).toBe('42 m')
    expect(formatDistance(999)).toBe('999 m')
  })

  it('renders distances of 1km or more in kilometers to one decimal', () => {
    expect(formatDistance(1000)).toBe('1.0 km')
    expect(formatDistance(2400)).toBe('2.4 km')
  })
})
