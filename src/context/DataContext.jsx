import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { fetchCats, fetchSightings, insertCat, insertSighting, updateCatRow } from '../services/db'
import { supabase } from '../services/supabaseClient'
import { distanceMeters } from '../services/geo'

const DataContext = createContext(null)

const NEARBY_RADIUS_METERS = 150

const LEGACY_CATS_KEY = 'straydar.cats.v1'
const LEGACY_SIGHTINGS_KEY = 'straydar.sightings.v1'
const MIGRATED_KEY = 'straydar.migrated.v1'

function readLegacy(key) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

// One-time upload of a browser's pre-Supabase localStorage cats/sightings
// into the shared backend, so switching backends doesn't erase anyone's
// in-progress reports. Only cats the user actually added (not demo seed
// cats, which now live in Supabase already) are migrated; a sighting the
// user added to a *seed* cat can't be distinguished from an original seed
// sighting once persisted, so it's left behind.
async function migrateLocalData() {
  if (localStorage.getItem(MIGRATED_KEY)) return

  const legacyCats = readLegacy(LEGACY_CATS_KEY)
  const legacySightings = readLegacy(LEGACY_SIGHTINGS_KEY)
  const userCats = legacyCats.filter((cat) => !cat.is_seed)

  const idMap = new Map()
  for (const cat of userCats) {
    const { id: _oldId, created_at: _createdAt, updated_at: _updatedAt, ...rest } = cat
    const inserted = await insertCat(rest)
    idMap.set(cat.id, inserted.id)
  }

  const userSightings = legacySightings.filter((sighting) => idMap.has(sighting.cat_id))
  for (const sighting of userSightings) {
    const { id: _oldId, created_at: _createdAt, ...rest } = sighting
    await insertSighting({ ...rest, cat_id: idMap.get(sighting.cat_id) })
  }

  localStorage.setItem(MIGRATED_KEY, 'true')
}

function upsertById(setState, row) {
  setState((prev) => {
    const index = prev.findIndex((item) => item.id === row.id)
    if (index === -1) return [...prev, row]
    const next = [...prev]
    next[index] = row
    return next
  })
}

export function DataProvider({ children }) {
  const [cats, setCats] = useState([])
  const [sightings, setSightings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function init() {
      try {
        await migrateLocalData()
      } catch (err) {
        console.error('Local data migration failed, will retry next load', err)
      }

      try {
        const [catsData, sightingsData] = await Promise.all([fetchCats(), fetchSightings()])
        if (!cancelled) {
          setCats(catsData)
          setSightings(sightingsData)
        }
      } catch (err) {
        if (!cancelled) setError(err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    init()

    const channel = supabase
      .channel('public:straydar')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cats' }, (payload) => {
        if (payload.eventType === 'DELETE') {
          setCats((prev) => prev.filter((cat) => cat.id !== payload.old.id))
          return
        }
        upsertById(setCats, payload.new)
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sightings' }, (payload) => {
        if (payload.eventType === 'DELETE') {
          setSightings((prev) => prev.filter((sighting) => sighting.id !== payload.old.id))
          return
        }
        upsertById(setSightings, payload.new)
      })
      .subscribe()

    return () => {
      cancelled = true
      supabase.removeChannel(channel)
    }
  }, [])

  const addCat = async (catData) => {
    const cat = await insertCat({
      name: 'Unknown Cat',
      status: 'sighted_temporary',
      description: '',
      temperament: 'unknown',
      needs_medical_attention: false,
      medical_details: null,
      primary_photo_url: null,
      ...catData,
    })
    upsertById(setCats, cat)
    return cat
  }

  const updateCat = async (catId, patch) => {
    const cat = await updateCatRow(catId, patch)
    upsertById(setCats, cat)
    return cat
  }

  const addSighting = async (sightingData) => {
    const sighting = await insertSighting({
      cat_id: null,
      reporter_id: null,
      sighting_time: new Date().toISOString(),
      photo_url: null,
      last_fed_date: null,
      notes: '',
      ...sightingData,
    })
    upsertById(setSightings, sighting)
    return sighting
  }

  const findNearbySightings = (coords, radiusMeters = NEARBY_RADIUS_METERS) => {
    return sightings
      .map((sighting) => ({
        sighting,
        distance: distanceMeters(coords, sighting),
      }))
      .filter(({ distance }) => distance <= radiusMeters)
      .sort((a, b) => a.distance - b.distance)
  }

  const getCatById = (catId) => cats.find((cat) => cat.id === catId) || null

  const getSightingsForCat = (catId) =>
    sightings
      .filter((sighting) => sighting.cat_id === catId)
      .sort((a, b) => new Date(b.sighting_time) - new Date(a.sighting_time))

  const value = useMemo(
    () => ({
      cats,
      sightings,
      loading,
      error,
      addCat,
      updateCat,
      addSighting,
      findNearbySightings,
      getCatById,
      getSightingsForCat,
    }),
    [cats, sightings, loading, error],
  )

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData must be used within a DataProvider')
  return ctx
}
