// Runs the ACTUAL Straydar dedup engine against eval/dataset.mjs.
//
// Imports, with no reimplementation of any scoring logic:
// - findDuplicateCandidates, attributeMatchScore, matchStrength
//   from src/services/matching.js (the production engine)
// - distanceMeters, offsetCoords from src/services/geo.js (production geo)
//
// findDuplicateCandidates is dependency-injected by design. The only code
// supplied here is the same findNearbySightings / getCatById glue that
// src/context/DataContext.jsx supplies in the app: filter sightings by
// distanceMeters(coords, sighting) <= radius, sorted by distance. That glue
// contains no matching or scoring decisions.
//
// Usage: node eval/run_eval.mjs   (writes eval/results.json, prints summary)

import { writeFileSync } from 'node:fs'
import { findDuplicateCandidates } from '../src/services/matching.js'
import { distanceMeters, offsetCoords } from '../src/services/geo.js'
import { CASES } from './dataset.mjs'

const ORIGIN = { latitude: 34.0967, longitude: -117.7198 }

function runCase(testCase, index) {
  // One existing cat with one sighting at ORIGIN. The incoming report sits
  // exactly testCase.distanceM away (bearing varies deterministically so
  // the pair is not always due north).
  const existingCat = { id: `cat-${testCase.id}`, ...testCase.existing }
  const sighting = { cat_id: existingCat.id, ...ORIGIN }
  const incomingCoords = offsetCoords(ORIGIN, testCase.distanceM, (index * 47) % 360)

  const deps = {
    findNearbySightings: (coords, radiusMeters) =>
      [{ sighting, distance: distanceMeters(coords, sighting) }]
        .filter(({ distance }) => distance <= radiusMeters)
        .sort((a, b) => a.distance - b.distance),
    getCatById: (id) => (id === existingCat.id ? existingCat : null),
  }

  const candidates = findDuplicateCandidates(
    { coords: incomingCoords, temperament: testCase.incoming.temperament, description: testCase.incoming.description },
    deps,
  )
  const top = candidates[0] || null
  return {
    ...testCase,
    actualDistanceM: top ? Math.round(top.distance * 10) / 10 : Math.round(distanceMeters(incomingCoords, sighting) * 10) / 10,
    flagged: candidates.length > 0,
    score: top ? top.score : null,
    strength: top ? top.strength : null,
    reasons: top ? top.reasons : [],
  }
}

function metrics(results, predict) {
  let tp = 0, fp = 0, tn = 0, fn = 0
  for (const r of results) {
    const pred = predict(r)
    if (pred && r.shouldMerge) tp++
    else if (pred && !r.shouldMerge) fp++
    else if (!pred && !r.shouldMerge) tn++
    else fn++
  }
  const precision = tp + fp === 0 ? 0 : tp / (tp + fp)
  const recall = tp + fn === 0 ? 0 : tp / (tp + fn)
  const f1 = precision + recall === 0 ? 0 : (2 * precision * recall) / (precision + recall)
  const round = (x) => Math.round(x * 1000) / 1000
  return { tp, fp, tn, fn, precision: round(precision), recall: round(recall), f1: round(f1), accuracy: round((tp + tn) / results.length) }
}

const results = CASES.map(runCase)

const operatingPoints = {
  // The engine's own "Likely match" label: score >= 2.
  strong_score_ge_2: metrics(results, (r) => r.strength === 'strong'),
  // "Possible" or better: score >= 1.
  possible_or_better_score_ge_1: metrics(results, (r) => r.flagged && r.score >= 1),
  // What actually happens in the app today: ANY candidate within 150 m,
  // even score 0 ("Nearby cat"), pauses submission and opens DedupModal.
  any_candidate_within_150m: metrics(results, (r) => r.flagged),
}

const summary = {
  dataset: {
    totalPairs: results.length,
    shouldMerge: results.filter((r) => r.shouldMerge).length,
    shouldNotMerge: results.filter((r) => !r.shouldMerge).length,
  },
  operatingPoints,
  failuresAtStrong: results
    .filter((r) => (r.strength === 'strong') !== r.shouldMerge)
    .map((r) => ({ id: r.id, shouldMerge: r.shouldMerge, category: r.category, distanceM: r.distanceM, score: r.score, strength: r.strength, flagged: r.flagged, reasons: r.reasons, rationale: r.rationale })),
  allResults: results,
}

writeFileSync(new URL('./results.json', import.meta.url), JSON.stringify(summary, null, 2) + '\n')
console.log(JSON.stringify({ dataset: summary.dataset, operatingPoints }, null, 2))
console.log('\nFailures at the strong (score >= 2) threshold:')
for (const f of summary.failuresAtStrong) {
  console.log(`- ${f.id} shouldMerge=${f.shouldMerge} category=${f.category} dist=${f.distanceM}m score=${f.score} strength=${f.strength} flagged=${f.flagged} :: ${f.rationale}`)
}
