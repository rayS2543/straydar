import { afterEach, describe, expect, it, vi } from 'vitest'
import { findNearbyVets } from './vetLookup'

const originalFetch = global.fetch

afterEach(() => {
  global.fetch = originalFetch
  vi.restoreAllMocks()
})

function jsonResponse(body, ok = true, status = 200) {
  return { ok, status, json: async () => body }
}

describe('findNearbyVets', () => {
  it('maps OSM elements into vet records, deriving address and coordinates', async () => {
    global.fetch = vi.fn().mockResolvedValue(
      jsonResponse({
        elements: [
          {
            type: 'node',
            id: 123,
            lat: 37.76,
            lon: -122.41,
            tags: {
              name: 'Mission Vet',
              phone: '415-555-0101',
              'addr:housenumber': '100',
              'addr:street': 'Valencia St',
              'addr:city': 'San Francisco',
              'addr:state': 'CA',
            },
          },
        ],
      }),
    )

    const vets = await findNearbyVets({ latitude: 37.7599, longitude: -122.4148 })

    expect(vets).toEqual([
      {
        id: 'osm-node-123',
        name: 'Mission Vet',
        address: '100 Valencia St, San Francisco, CA',
        phone: '415-555-0101',
        latitude: 37.76,
        longitude: -122.41,
      },
    ])
  })

  it('reads lat/lon from the "center" field for way elements', async () => {
    global.fetch = vi.fn().mockResolvedValue(
      jsonResponse({
        elements: [
          {
            type: 'way',
            id: 456,
            center: { lat: 37.77, lon: -122.42 },
            tags: { name: 'Way Vet Clinic' },
          },
        ],
      }),
    )

    const vets = await findNearbyVets({ latitude: 37.7599, longitude: -122.4148 })
    expect(vets).toEqual([
      {
        id: 'osm-way-456',
        name: 'Way Vet Clinic',
        address: null,
        phone: null,
        latitude: 37.77,
        longitude: -122.42,
      },
    ])
  })

  it('falls back to contact:phone when phone tag is absent', async () => {
    global.fetch = vi.fn().mockResolvedValue(
      jsonResponse({
        elements: [
          {
            type: 'node',
            id: 1,
            lat: 1,
            lon: 2,
            tags: { name: 'Vet', 'contact:phone': '555-1234' },
          },
        ],
      }),
    )
    const [vet] = await findNearbyVets({ latitude: 0, longitude: 0 })
    expect(vet.phone).toBe('555-1234')
  })

  it('filters out elements missing a name or coordinates', async () => {
    global.fetch = vi.fn().mockResolvedValue(
      jsonResponse({
        elements: [
          { type: 'node', id: 1, lat: 1, lon: 2, tags: {} }, // no name
          { type: 'node', id: 2, tags: { name: 'No Coords Vet' } }, // no lat/lon
          { type: 'node', id: 3, lat: 3, lon: 4, tags: { name: 'Valid Vet' } },
        ],
      }),
    )
    const vets = await findNearbyVets({ latitude: 0, longitude: 0 })
    expect(vets).toHaveLength(1)
    expect(vets[0].name).toBe('Valid Vet')
  })

  it('returns an empty array when there are no elements', async () => {
    global.fetch = vi.fn().mockResolvedValue(jsonResponse({}))
    const vets = await findNearbyVets({ latitude: 0, longitude: 0 })
    expect(vets).toEqual([])
  })

  it('throws when the response is not ok', async () => {
    global.fetch = vi.fn().mockResolvedValue(jsonResponse({}, false, 503))
    await expect(findNearbyVets({ latitude: 0, longitude: 0 })).rejects.toThrow(
      'Vet lookup failed (503)',
    )
  })

  it('POSTs the overpass query with the requested radius', async () => {
    global.fetch = vi.fn().mockResolvedValue(jsonResponse({ elements: [] }))
    await findNearbyVets({ latitude: 10, longitude: 20 }, 5000)

    expect(global.fetch).toHaveBeenCalledTimes(1)
    const [url, options] = global.fetch.mock.calls[0]
    expect(url).toBe('https://overpass-api.de/api/interpreter')
    expect(options.method).toBe('POST')
    const body = options.body.get('data')
    expect(body).toContain('around:5000,10,20')
  })
})
