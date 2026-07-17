import { SEED_CATS, SEED_SIGHTINGS } from './seedData'

const KEYS = {
  cats: 'straydar.cats.v1',
  sightings: 'straydar.sightings.v1',
}

export function genId(prefix = 'id') {
  const rand =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2)
  return `${prefix}-${rand}`
}

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

function write(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

export function loadDatabase() {
  const seeded = localStorage.getItem(KEYS.cats) !== null
  if (!seeded) {
    write(KEYS.cats, SEED_CATS)
    write(KEYS.sightings, SEED_SIGHTINGS)
  }
  return {
    cats: read(KEYS.cats, SEED_CATS),
    sightings: read(KEYS.sightings, SEED_SIGHTINGS),
  }
}

export function persistCats(cats) {
  write(KEYS.cats, cats)
}

export function persistSightings(sightings) {
  write(KEYS.sightings, sightings)
}

export function resetDatabase() {
  write(KEYS.cats, SEED_CATS)
  write(KEYS.sightings, SEED_SIGHTINGS)
  return { cats: SEED_CATS, sightings: SEED_SIGHTINGS }
}
