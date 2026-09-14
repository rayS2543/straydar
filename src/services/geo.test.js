import { describe, expect, it } from 'vitest'
import { distanceMeters, formatDistance, offsetCoords, toRad } from './geo'

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

describe('offsetCoords', () => {
  it('lands the requested distance away from the origin', () => {
    const origin = { latitude: 37.7599, longitude: -122.4148 }
    const point = offsetCoords(origin, 200, 45)
    expect(distanceMeters(origin, point)).toBeCloseTo(200, 0)
  })

  it('moves north for a bearing of 0', () => {
    const origin = { latitude: 37.7599, longitude: -122.4148 }
    const point = offsetCoords(origin, 200, 0)
    expect(point.latitude).toBeGreaterThan(origin.latitude)
    expect(point.longitude).toBeCloseTo(origin.longitude, 5)
  })

  it('moves east for a bearing of 90', () => {
    const origin = { latitude: 37.7599, longitude: -122.4148 }
    const point = offsetCoords(origin, 200, 90)
    expect(point.longitude).toBeGreaterThan(origin.longitude)
    expect(point.latitude).toBeCloseTo(origin.latitude, 3)
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
