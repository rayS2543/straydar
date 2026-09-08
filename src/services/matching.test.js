import { describe, expect, it } from 'vitest'
import { attributeMatchScore, findDuplicateCandidates, matchStrength } from './matching'

describe('attributeMatchScore', () => {
  it('scores matching temperament', () => {
    const { score, reasons } = attributeMatchScore(
      { temperament: 'friendly', description: '' },
      { temperament: 'friendly', description: '' },
    )
    expect(score).toBe(2)
    expect(reasons).toContain('same temperament')
  })

  it('does not credit "unknown" as a matching temperament', () => {
    const { score, reasons } = attributeMatchScore(
      { temperament: 'unknown', description: '' },
      { temperament: 'unknown', description: '' },
    )
    expect(score).toBe(0)
    expect(reasons).toHaveLength(0)
  })

  it('scores one point per shared significant description word', () => {
    const { score, reasons } = attributeMatchScore(
      { temperament: 'unknown', description: 'Orange tabby near the garden gate' },
      { temperament: 'unknown', description: 'Saw an orange tabby by the fence' },
    )
    expect(score).toBe(2) // "orange" + "tabby"
    expect(reasons[0]).toMatch(/orange/)
  })

  it('ignores stopwords and short words when matching description text', () => {
    const { score } = attributeMatchScore(
      { temperament: 'unknown', description: 'The cat was seen near the shop' },
      { temperament: 'unknown', description: 'A cat is by the shop' },
    )
    // "the"/"cat"/"was"/"seen"/"near"/"a"/"is"/"by" are all stopwords or too short;
    // only "shop" is a genuine shared signal.
    expect(score).toBe(1)
  })

  it('combines temperament and description matches additively', () => {
    const { score } = attributeMatchScore(
      { temperament: 'skittish', description: 'black shorthair alley cat' },
      { temperament: 'skittish', description: 'black shorthair near the alley' },
    )
    expect(score).toBe(2 + 3) // temperament + "black" + "shorthair" + "alley"
  })
})

describe('matchStrength', () => {
  it('classifies score thresholds', () => {
    expect(matchStrength(0)).toBe('nearby')
    expect(matchStrength(1)).toBe('possible')
    expect(matchStrength(2)).toBe('strong')
    expect(matchStrength(5)).toBe('strong')
  })
})

describe('findDuplicateCandidates', () => {
  const marmalade = { id: 'cat-1', temperament: 'friendly', description: 'Orange tabby near the garden' }
  const shadow = { id: 'cat-2', temperament: 'skittish', description: 'Black shorthair by the laundromat' }

  const cats = { [marmalade.id]: marmalade, [shadow.id]: shadow }
  const getCatById = (id) => cats[id] ?? null

  function makeDeps(nearbySightings) {
    return {
      findNearbySightings: () => nearbySightings,
      getCatById,
    }
  }

  it('returns no candidates when nothing is nearby', () => {
    const candidates = findDuplicateCandidates(
      { coords: { latitude: 0, longitude: 0 }, temperament: 'friendly', description: '' },
      makeDeps([]),
    )
    expect(candidates).toEqual([])
  })

  it('ignores sightings that are not linked to a cat', () => {
    const candidates = findDuplicateCandidates(
      { coords: { latitude: 0, longitude: 0 }, temperament: 'friendly', description: '' },
      makeDeps([{ sighting: { cat_id: null }, distance: 10 }]),
    )
    expect(candidates).toEqual([])
  })

  it('returns one candidate per cat, using its closest nearby sighting', () => {
    const candidates = findDuplicateCandidates(
      { coords: { latitude: 0, longitude: 0 }, temperament: 'friendly', description: 'orange tabby' },
      makeDeps([
        { sighting: { cat_id: 'cat-1' }, distance: 80 },
        { sighting: { cat_id: 'cat-1' }, distance: 20 }, // closer sighting of the same cat
      ]),
    )
    expect(candidates).toHaveLength(1)
    expect(candidates[0].distance).toBe(20)
    expect(candidates[0].cat).toBe(marmalade)
  })

  it('ranks by score first, then by distance', () => {
    const candidates = findDuplicateCandidates(
      { coords: { latitude: 0, longitude: 0 }, temperament: 'friendly', description: 'orange tabby' },
      makeDeps([
        { sighting: { cat_id: 'cat-2' }, distance: 5 }, // closer, but no attribute match
        { sighting: { cat_id: 'cat-1' }, distance: 100 }, // farther, but matches temperament + words
      ]),
    )
    expect(candidates.map((c) => c.cat.id)).toEqual(['cat-1', 'cat-2'])
    expect(candidates[0].strength).toBe('strong')
    expect(candidates[1].strength).toBe('nearby')
  })
})
