import { createContext, useContext, useMemo, useState } from 'react'
import { genId, loadDatabase, persistCats, persistSightings, resetDatabase } from '../services/db'
import { distanceMeters } from '../services/geo'

const DataContext = createContext(null)

const NEARBY_RADIUS_METERS = 150

export function DataProvider({ children }) {
  const [{ cats, sightings }, setState] = useState(loadDatabase)

  const setCats = (updater) => {
    setState((prev) => {
      const cats = typeof updater === 'function' ? updater(prev.cats) : updater
      persistCats(cats)
      return { ...prev, cats }
    })
  }

  const setSightings = (updater) => {
    setState((prev) => {
      const sightings = typeof updater === 'function' ? updater(prev.sightings) : updater
      persistSightings(sightings)
      return { ...prev, sightings }
    })
  }

  const addCat = (catData) => {
    const now = new Date().toISOString()
    const cat = {
      id: genId('cat'),
      name: 'Unknown Cat',
      status: 'sighted_temporary',
      description: '',
      temperament: 'unknown',
      needs_medical_attention: false,
      medical_details: null,
      primary_photo_url: null,
      created_at: now,
      updated_at: now,
      ...catData,
    }
    setCats((prev) => [...prev, cat])
    return cat
  }

  const updateCat = (catId, patch) => {
    setCats((prev) =>
      prev.map((cat) =>
        cat.id === catId
          ? { ...cat, ...patch, updated_at: new Date().toISOString() }
          : cat,
      ),
    )
  }

  const addSighting = (sightingData) => {
    const now = new Date().toISOString()
    const sighting = {
      id: genId('sighting'),
      cat_id: null,
      reporter_id: null,
      sighting_time: now,
      photo_url: null,
      last_fed_date: null,
      notes: '',
      created_at: now,
      ...sightingData,
    }
    setSightings((prev) => [sighting, ...prev])
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

  const reset = () => {
    const data = resetDatabase()
    setState(data)
  }

  const value = useMemo(
    () => ({
      cats,
      sightings,
      addCat,
      updateCat,
      addSighting,
      findNearbySightings,
      getCatById,
      getSightingsForCat,
      reset,
    }),
    [cats, sightings],
  )

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData must be used within a DataProvider')
  return ctx
}
