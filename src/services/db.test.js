import { beforeEach, describe, expect, it } from 'vitest'
import { genId, loadDatabase, persistCats, persistSightings, resetDatabase } from './db'
import { SEED_CATS, SEED_SIGHTINGS } from './seedData'

beforeEach(() => {
  localStorage.clear()
})

describe('genId', () => {
  it('prefixes the generated id', () => {
    expect(genId('cat')).toMatch(/^cat-/)
    expect(genId()).toMatch(/^id-/)
  })

  it('generates unique ids across calls', () => {
    const ids = new Set(Array.from({ length: 20 }, () => genId('x')))
    expect(ids.size).toBe(20)
  })
})

describe('loadDatabase', () => {
  it('seeds localStorage on first load', () => {
    expect(localStorage.getItem('straydar.cats.v1')).toBeNull()
    const { cats, sightings } = loadDatabase()
    expect(cats).toEqual(SEED_CATS)
    expect(sightings).toEqual(SEED_SIGHTINGS)
    expect(JSON.parse(localStorage.getItem('straydar.cats.v1'))).toEqual(SEED_CATS)
  })

  it('does not reseed once data already exists', () => {
    loadDatabase()
    persistCats([{ id: 'cat-custom' }])
    const { cats } = loadDatabase()
    expect(cats).toEqual([{ id: 'cat-custom' }])
  })

  it('falls back to seed data if stored JSON is corrupted', () => {
    localStorage.setItem('straydar.cats.v1', '{not valid json')
    localStorage.setItem('straydar.sightings.v1', '{not valid json')
    const { cats, sightings } = loadDatabase()
    expect(cats).toEqual(SEED_CATS)
    expect(sightings).toEqual(SEED_SIGHTINGS)
  })
})

describe('persistCats / persistSightings', () => {
  it('writes cats to localStorage', () => {
    const cats = [{ id: 'cat-1', name: 'Test' }]
    persistCats(cats)
    expect(JSON.parse(localStorage.getItem('straydar.cats.v1'))).toEqual(cats)
  })

  it('writes sightings to localStorage', () => {
    const sightings = [{ id: 'sighting-1' }]
    persistSightings(sightings)
    expect(JSON.parse(localStorage.getItem('straydar.sightings.v1'))).toEqual(sightings)
  })
})

describe('resetDatabase', () => {
  it('overwrites stored data with the seed data and returns it', () => {
    persistCats([{ id: 'cat-custom' }])
    persistSightings([{ id: 'sighting-custom' }])

    const result = resetDatabase()

    expect(result).toEqual({ cats: SEED_CATS, sightings: SEED_SIGHTINGS })
    expect(JSON.parse(localStorage.getItem('straydar.cats.v1'))).toEqual(SEED_CATS)
    expect(JSON.parse(localStorage.getItem('straydar.sightings.v1'))).toEqual(SEED_SIGHTINGS)
  })
})
