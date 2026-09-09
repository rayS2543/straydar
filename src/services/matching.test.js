import { describe, expect, it } from 'vitest'
import { attributeMatchScore, findDuplicateCandidates, matchStrength } from './matching'

describe('attributeMatchScore', () => {
  it('scores same non-unknown temperament', () => {
    const { score, reasons } = attributeMatchScore(
      { temperament: 'friendly', description: '' },
      { temperament: 'friendly', description: '' },
    )
    expect(score).toBe(2)
    expect(reasons).toContain('same temperament')
  })

  it('does not award points when both are unknown temperament', () => {
    const { score, reasons } = attributeMatchScore(
      { temperament: 'unknown', description: '' },
      { temperament: 'unknown', description: '' },
    )
    expect(score).toBe(0)
    expect(reasons).toEqual([])
  })

  it('does not award points for mismatched temperament', () => {
    const { score } = attributeMatchScore(
      { temperament: 'friendly', description: '' },
      { temperament: 'skittish', description: '' },
    )
    expect(score).toBe(0)
  })

  it('scores shared significant description keywords', () => {
    const { score, reasons } = attributeMatchScore(
      { temperament: 'unknown', description: 'Orange tabby near the garden' },
      { temperament: 'unknown', description: 'Saw an orange tabby by the fence' },
    )
    expect(score).toBe(2)
    expect(reasons[0]).toContain('orange')
    expect(reasons[0]).toContain('tabby')
  })

  it('ignores stopwords and short words when matching descriptions', () => {
    const { score } = attributeMatchScore(
      { temperament: 'unknown', description: 'The cat was seen near a bin' },
      { temperament: 'unknown', description: 'A cat has been very near it' },
    )
    expect(score).toBe(0)
  })

  it('combines temperament and description scores', () => {
    const { score, reasons } = attributeMatchScore(
      { temperament: 'feral', description: 'Calico with a limp' },
      { temperament: 'feral', description: 'Calico cat limping badly' },
    )
    // +2 for matching temperament, +1 for the shared "calico" keyword.
    expect(score).toBe(3)
    expect(reasons).toHaveLength(2)
  })
})

describe('matchStrength', () => {
  it('classifies scores into strength buckets', () => {
    expect(matchStrength(0)).toBe('nearby')
    expect(matchStrength(1)).toBe('possible')
    expect(matchStrength(2)).toBe('strong')
    expect(matchStrength(5)).toBe('strong')
  })
})

describe('findDuplicateCandidates', () => {
  const coords = { latitude: 37.7599, longitude: -122.4148 }

  const cats = {
    'cat-1': { id: 'cat-1', temperament: 'friendly', description: 'Orange tabby near garden' },
    'cat-2': { id: 'cat-2', temperament: 'skittish', description: 'Black cat by dumpster' },
  }

  const makeDeps = (nearby) => ({
    findNearbySightings: () => nearby,
    getCatById: (id) => cats[id] || null,
  })

  it('returns an empty list when there are no nearby sightings', () => {
    const result = findDuplicateCandidates(
      { coords, temperament: 'friendly', description: '' },
      makeDeps([]),
    )
    expect(result).toEqual([])
  })

  it('skips sightings that are not linked to a cat', () => {
    const nearby = [{ sighting: { cat_id: null }, distance: 10 }]
    const result = findDuplicateCandidates(
      { coords, temperament: 'friendly', description: '' },
      makeDeps(nearby),
    )
    expect(result).toEqual([])
  })

  it('skips sightings whose cat no longer exists', () => {
    const nearby = [{ sighting: { cat_id: 'cat-missing' }, distance: 10 }]
    const result = findDuplicateCandidates(
      { coords, temperament: 'friendly', description: '' },
      makeDeps(nearby),
    )
    expect(result).toEqual([])
  })

  it('keeps only the closest sighting per cat', () => {
    const nearby = [
      { sighting: { cat_id: 'cat-1' }, distance: 50 },
      { sighting: { cat_id: 'cat-1' }, distance: 10 },
    ]
    const result = findDuplicateCandidates(
      { coords, temperament: 'friendly', description: '' },
      makeDeps(nearby),
    )
    expect(result).toHaveLength(1)
    expect(result[0].distance).toBe(10)
  })

  it('ranks candidates by score then distance', () => {
    const nearby = [
      { sighting: { cat_id: 'cat-2' }, distance: 5 },
      { sighting: { cat_id: 'cat-1' }, distance: 100 },
    ]
    const result = findDuplicateCandidates(
      { coords, temperament: 'friendly', description: 'Orange tabby near garden' },
      makeDeps(nearby),
    )
    expect(result).toHaveLength(2)
    // cat-1 scores higher on attributes despite being farther away.
    expect(result[0].cat.id).toBe('cat-1')
    expect(result[0].strength).toBe('strong')
    expect(result[1].cat.id).toBe('cat-2')
  })
})
