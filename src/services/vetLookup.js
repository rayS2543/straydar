const OVERPASS_URL = 'https://overpass-api.de/api/interpreter'
const REQUEST_TIMEOUT_MS = 15000

function buildAddress(tags) {
  const street = [tags['addr:housenumber'], tags['addr:street']].filter(Boolean).join(' ')
  const cityLine = [tags['addr:city'], tags['addr:state']].filter(Boolean).join(', ')
  return [street, cityLine].filter(Boolean).join(', ') || null
}

// Queries OpenStreetMap (via Overpass) for real veterinary clinics within
// radiusMeters of the given coords. No API key required.
export async function findNearbyVets({ latitude, longitude }, radiusMeters = 25000) {
  const query = `
    [out:json][timeout:15];
    (
      node["amenity"="veterinary"](around:${radiusMeters},${latitude},${longitude});
      way["amenity"="veterinary"](around:${radiusMeters},${latitude},${longitude});
    );
    out center tags;
  `

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  let response
  try {
    response = await fetch(OVERPASS_URL, {
      method: 'POST',
      body: new URLSearchParams({ data: query }),
      signal: controller.signal,
    })
  } finally {
    clearTimeout(timeout)
  }

  if (!response.ok) {
    throw new Error(`Vet lookup failed (${response.status})`)
  }

  const { elements = [] } = await response.json()

  return elements
    .map((el) => {
      const tags = el.tags || {}
      const lat = el.lat ?? el.center?.lat
      const lon = el.lon ?? el.center?.lon
      if (lat == null || lon == null || !tags.name) return null
      return {
        id: `osm-${el.type}-${el.id}`,
        name: tags.name,
        address: buildAddress(tags),
        phone: tags.phone || tags['contact:phone'] || null,
        latitude: lat,
        longitude: lon,
      }
    })
    .filter(Boolean)
}
