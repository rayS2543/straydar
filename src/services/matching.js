const STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'with', 'near', 'by', 'on', 'at', 'is', 'was',
  'has', 'have', 'very', 'seen', 'near', 'around', 'cat',
])

function significantWords(text) {
  return (text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 2 && !STOPWORDS.has(word))
}

// Simple heuristic attribute match: shared temperament + overlapping description keywords.
export function attributeMatchScore(a, b) {
  let score = 0
  const reasons = []

  if (a.temperament && b.temperament && a.temperament === b.temperament && a.temperament !== 'unknown') {
    score += 2
    reasons.push('same temperament')
  }

  const wordsA = new Set(significantWords(a.description))
  const wordsB = new Set(significantWords(b.description))
  const shared = [...wordsA].filter((word) => wordsB.has(word))
  if (shared.length > 0) {
    score += shared.length
    reasons.push(`shares "${shared.join(', ')}"`)
  }

  return { score, reasons }
}

export function matchStrength(score) {
  if (score >= 2) return 'strong'
  if (score >= 1) return 'possible'
  return 'nearby'
}

// Finds existing cats with a sighting within radiusMeters of coords, ranked by
// attribute match score (then distance). One entry per candidate cat.
export function findDuplicateCandidates(
  { coords, temperament, description },
  { findNearbySightings, getCatById },
  radiusMeters = 150,
) {
  const nearby = findNearbySightings(coords, radiusMeters)

  const closestByCatId = new Map()
  for (const { sighting, distance } of nearby) {
    if (!sighting.cat_id) continue
    const existing = closestByCatId.get(sighting.cat_id)
    if (!existing || distance < existing.distance) {
      closestByCatId.set(sighting.cat_id, { sighting, distance })
    }
  }

  const candidates = []
  for (const [catId, { sighting, distance }] of closestByCatId) {
    const cat = getCatById(catId)
    if (!cat) continue
    const { score, reasons } = attributeMatchScore(cat, { temperament, description })
    candidates.push({ cat, sighting, distance, score, reasons, strength: matchStrength(score) })
  }

  candidates.sort((a, b) => b.score - a.score || a.distance - b.distance)
  return candidates
}
