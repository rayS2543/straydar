const STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'with', 'near', 'by', 'on', 'at', 'is', 'was',
  'has', 'have', 'very', 'seen', 'near', 'around', 'cat',
])

// Small synonym map for the vocabulary people actually use to describe cats,
// so spelling and wording variants of the same trait match each other.
const SYNONYMS = {
  gray: 'grey',
  ginger: 'orange',
  tortie: 'tortoiseshell',
  kitty: 'kitten',
  skinny: 'thin',
  petite: 'small',
}

// Coat and marking color terms. When both descriptions name colors and the
// sets do not overlap at all, that is evidence against a match, not silence.
const COLOR_WORDS = new Set([
  'black', 'white', 'orange', 'grey', 'brown', 'cream', 'red', 'blue',
  'green', 'calico', 'tortoiseshell',
])
const COLOR_CONFLICT_PENALTY = 2

const NEGATORS = new Set(['no', 'not', 'without', 'never'])

// Light stemming: folds common suffix variants (limp/limping, tip/tipped,
// paws/paw) onto one token. Applied identically to both descriptions.
function normalizeWord(word) {
  let w = SYNONYMS[word] || word
  if (w.endsWith('ing') && w.length > 5) w = w.slice(0, -3)
  else if (w.endsWith('ed') && w.length > 4) w = w.slice(0, -2)
  else if (w.endsWith('s') && !w.endsWith('ss') && w.length > 3) w = w.slice(0, -1)
  else return w
  // Undouble a final consonant left by suffix stripping (tipp -> tip).
  if (w.length > 2 && w[w.length - 1] === w[w.length - 2] && !'aeiou'.includes(w[w.length - 1])) {
    w = w.slice(0, -1)
  }
  return SYNONYMS[w] || w
}

// Significant words of a description, normalized. A word directly negated
// ("no white markings") is excluded from the matchable set and returned in
// `negated` instead, so it can never count as a shared trait.
function significantWords(text) {
  const tokens = (text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
  const words = new Set()
  const negated = new Set()
  let negateNext = false
  for (const token of tokens) {
    if (NEGATORS.has(token)) {
      negateNext = true
      continue
    }
    if (token.length <= 2 || STOPWORDS.has(token)) continue
    const normalized = normalizeWord(token)
    if (negateNext) {
      negated.add(normalized)
      negateNext = false
    } else {
      words.add(normalized)
    }
  }
  return { words, negated }
}

// Simple heuristic attribute match: shared temperament + overlapping description keywords.
export function attributeMatchScore(a, b) {
  let score = 0
  const reasons = []

  if (a.temperament && b.temperament && a.temperament === b.temperament && a.temperament !== 'unknown') {
    score += 2
    reasons.push('same temperament')
  }

  const { words: wordsA } = significantWords(a.description)
  const { words: wordsB } = significantWords(b.description)
  const shared = [...wordsA].filter((word) => wordsB.has(word))
  if (shared.length > 0) {
    score += shared.length
    reasons.push(`shares "${shared.join(', ')}"`)
  }

  const colorsA = [...wordsA].filter((word) => COLOR_WORDS.has(word))
  const colorsB = [...wordsB].filter((word) => COLOR_WORDS.has(word))
  if (colorsA.length > 0 && colorsB.length > 0 && !colorsA.some((word) => colorsB.includes(word))) {
    score -= COLOR_CONFLICT_PENALTY
    reasons.push(`conflicting colors (${colorsA.join(', ')} vs ${colorsB.join(', ')})`)
  }

  return { score, reasons, sharedWords: shared }
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
    const { score, reasons, sharedWords } = attributeMatchScore(cat, { temperament, description })
    // A "strong" rating requires at least one shared description word;
    // temperament alone caps the candidate at "possible".
    const strength = score >= 2 && sharedWords.length === 0 ? 'possible' : matchStrength(score)
    candidates.push({ cat, sighting, distance, score, reasons, strength })
  }

  candidates.sort((a, b) => b.score - a.score || a.distance - b.distance)
  return candidates
}
