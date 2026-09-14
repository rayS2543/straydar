// Client-side-only placeholder cats, generated around wherever the map opens.
// Shown only when the real (Supabase) dataset is empty, so a fresh deploy
// with zero real reports doesn't look dead. Nothing here is persisted —
// these never touch `insertCat`/`insertSighting`, so other users never see
// them. Reuses the existing `is_seed` flag so the "Demo" badge already in
// CatPopupContent/FeedPage kicks in for free.

import { offsetCoords } from './geo'

const hoursAgo = (h) => new Date(Date.now() - h * 60 * 60 * 1000).toISOString()
const daysAgo = (d) => hoursAgo(d * 24)

// Bearings spread roughly evenly around a circle (not fixed lat/lng deltas,
// which distort at higher latitudes) so the cats ring the user at walking
// distance instead of clustering in one direction or off in the water.
const TEMPLATES = [
  {
    name: 'Marmalade',
    status: 'stray_resident',
    description: 'Orange tabby, friendly, hangs around the block.',
    temperament: 'friendly',
    photo: 'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?w=400',
    bearing: 20,
    distanceM: 180,
    sightingHoursAgo: 20,
    notes: 'Comes right up when called, seems well-fed.',
  },
  {
    name: 'Shadow',
    status: 'stray_resident',
    description: 'Black shorthair, part of a small colony nearby.',
    temperament: 'skittish',
    photo: 'https://images.unsplash.com/photo-1548247416-ec66f4900b2e?w=400',
    bearing: 110,
    distanceM: 260,
    sightingHoursAgo: 70,
    notes: 'Keeps its distance but sticks to the same corner.',
  },
  {
    name: 'Unknown Cat',
    status: 'sighted_temporary',
    description: 'Grey and white, spotted once, no collar.',
    temperament: 'unknown',
    photo: 'https://images.unsplash.com/photo-1533738363-b7f9aef128ce?w=400',
    bearing: 200,
    distanceM: 150,
    sightingHoursAgo: 5,
    notes: 'First time seeing this one.',
  },
  {
    name: 'Biscuit',
    status: 'lost',
    description: 'Cream-colored longhair, last seen wearing a blue collar.',
    temperament: 'friendly',
    photo: 'https://images.unsplash.com/photo-1495360010541-f48722b34f7d?w=400',
    bearing: 290,
    distanceM: 220,
    sightingHoursAgo: 30,
    notes: 'Neighbor reported seeing a cat matching this description.',
  },
]

// Generates a stable-for-this-session set of demo cats/sightings around `center`.
export function generateDemoCats(center) {
  const cats = []
  const sightings = []

  TEMPLATES.forEach((template, index) => {
    const id = `demo-cat-${index}`
    const coords = offsetCoords(center, template.distanceM, template.bearing)

    cats.push({
      id,
      is_seed: true,
      name: template.name,
      status: template.status,
      description: template.description,
      temperament: template.temperament,
      needs_medical_attention: false,
      medical_details: null,
      primary_photo_url: template.photo,
      created_at: daysAgo(10),
      updated_at: hoursAgo(template.sightingHoursAgo),
    })

    sightings.push({
      id: `demo-sighting-${index}`,
      cat_id: id,
      reporter_id: null,
      latitude: coords.latitude,
      longitude: coords.longitude,
      sighting_time: hoursAgo(template.sightingHoursAgo),
      photo_url: template.photo,
      last_fed_date: null,
      notes: template.notes,
      created_at: hoursAgo(template.sightingHoursAgo),
    })
  })

  return { cats, sightings }
}
