const EARTH_RADIUS_M = 6371000

export function toRad(deg) {
  return (deg * Math.PI) / 180
}

// Haversine distance in meters between two lat/lng points.
export function distanceMeters(a, b) {
  const dLat = toRad(b.latitude - a.latitude)
  const dLng = toRad(b.longitude - a.longitude)
  const lat1 = toRad(a.latitude)
  const lat2 = toRad(b.latitude)

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2

  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h))
}

// Destination point given a start coord, distance in meters, and bearing in
// degrees (0 = north, 90 = east). Uses the spherical-earth formula so it
// stays accurate at any latitude, unlike adding a fixed lat/lng delta (which
// distorts badly near the poles since longitude degrees shrink there).
export function offsetCoords(origin, distanceM, bearingDeg) {
  const angularDistance = distanceM / EARTH_RADIUS_M
  const bearing = toRad(bearingDeg)
  const lat1 = toRad(origin.latitude)
  const lng1 = toRad(origin.longitude)

  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(angularDistance) +
      Math.cos(lat1) * Math.sin(angularDistance) * Math.cos(bearing),
  )
  const lng2 =
    lng1 +
    Math.atan2(
      Math.sin(bearing) * Math.sin(angularDistance) * Math.cos(lat1),
      Math.cos(angularDistance) - Math.sin(lat1) * Math.sin(lat2),
    )

  return { latitude: (lat2 * 180) / Math.PI, longitude: (lng2 * 180) / Math.PI }
}

export function formatDistance(meters) {
  if (meters < 1000) return `${Math.round(meters)} m`
  return `${(meters / 1000).toFixed(1)} km`
}
