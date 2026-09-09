import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { DataProvider, useData } from '../context/DataContext'
import { useReportSubmission } from './useReportSubmission'

beforeEach(() => {
  localStorage.clear()
})

function renderReportSubmission() {
  return renderHook(
    () => ({ report: useReportSubmission(), data: useData() }),
    { wrapper: DataProvider },
  )
}

const baseValues = (overrides = {}) => ({
  name: 'New Cat',
  status: 'sighted_temporary',
  description: 'A totally unique description with no overlap',
  temperament: 'unknown',
  needsMedical: false,
  medicalDetails: null,
  photoDataUrl: null,
  lastFedAt: null,
  coords: { latitude: 0, longitude: 0 }, // far from all seeded sightings
  ...overrides,
})

describe('useReportSubmission', () => {
  it('creates a brand-new cat and sighting when there are no nearby matches', () => {
    const { result } = renderReportSubmission()
    const catsBefore = result.current.data.cats.length
    const sightingsBefore = result.current.data.sightings.length

    let outcome
    act(() => {
      outcome = result.current.report.submitReport(baseValues())
    })

    expect(outcome.status).toBe('created')
    expect(result.current.data.cats).toHaveLength(catsBefore + 1)
    expect(result.current.data.sightings).toHaveLength(sightingsBefore + 1)
    expect(result.current.report.pending).toBeNull()
  })

  it('flags a nearby candidate as needing review instead of creating immediately', () => {
    const { result } = renderReportSubmission()

    // cat-1 "Marmalade" has a seeded sighting near CENTER (37.7599, -122.4148).
    const nearMarmalade = baseValues({
      coords: { latitude: 37.7611, longitude: -122.4156 }, // matches seeded sighting-1, within 150m of cat-1
      temperament: 'friendly',
      description: 'Orange tabby friendly cat near the community garden',
    })

    const catsBefore = result.current.data.cats.length
    let outcome
    act(() => {
      outcome = result.current.report.submitReport(nearMarmalade)
    })

    expect(outcome.status).toBe('needs-review')
    expect(result.current.data.cats).toHaveLength(catsBefore)
    expect(result.current.report.pending).not.toBeNull()
    expect(result.current.report.pending.candidates.length).toBeGreaterThan(0)
    expect(result.current.report.pending.candidates[0].cat.id).toBe('cat-1')
  })

  it('confirmSameCat links a new sighting to the existing cat without creating a new one', () => {
    const { result } = renderReportSubmission()

    act(() => {
      result.current.report.submitReport(
        baseValues({
          coords: { latitude: 37.7611, longitude: -122.4156 }, // matches seeded sighting-1, within 150m of cat-1
          temperament: 'friendly',
          description: 'Orange tabby friendly cat near the community garden',
        }),
      )
    })

    const catsBefore = result.current.data.cats.length
    const sightingsBefore = result.current.data.sightings.length
    const matchedCatId = result.current.report.pending.candidates[0].cat.id

    act(() => {
      result.current.report.confirmSameCat(matchedCatId)
    })

    expect(result.current.data.cats).toHaveLength(catsBefore)
    expect(result.current.data.sightings).toHaveLength(sightingsBefore + 1)
    expect(result.current.report.pending).toBeNull()
    const newSighting = result.current.data.sightings[0]
    expect(newSighting.cat_id).toBe(matchedCatId)
  })

  it('confirmNewCat creates a new cat despite pending duplicate candidates', () => {
    const { result } = renderReportSubmission()

    act(() => {
      result.current.report.submitReport(
        baseValues({
          coords: { latitude: 37.7611, longitude: -122.4156 }, // matches seeded sighting-1, within 150m of cat-1
          temperament: 'friendly',
          description: 'Orange tabby friendly cat near the community garden',
        }),
      )
    })

    const catsBefore = result.current.data.cats.length

    act(() => {
      result.current.report.confirmNewCat()
    })

    expect(result.current.data.cats).toHaveLength(catsBefore + 1)
    expect(result.current.report.pending).toBeNull()
  })

  it('cancelPending clears the pending state without mutating data', () => {
    const { result } = renderReportSubmission()

    act(() => {
      result.current.report.submitReport(
        baseValues({
          coords: { latitude: 37.7611, longitude: -122.4156 }, // matches seeded sighting-1, within 150m of cat-1
          temperament: 'friendly',
          description: 'Orange tabby friendly cat near the community garden',
        }),
      )
    })

    const catsBefore = result.current.data.cats.length
    const sightingsBefore = result.current.data.sightings.length

    act(() => {
      result.current.report.cancelPending()
    })

    expect(result.current.report.pending).toBeNull()
    expect(result.current.data.cats).toHaveLength(catsBefore)
    expect(result.current.data.sightings).toHaveLength(sightingsBefore)
  })
})
