import { useState } from 'react'
import { useData } from '../context/DataContext'
import { findDuplicateCandidates } from '../services/matching'

// Handles the "Add Report" pipeline: checks for nearby matching cats first
// (150m radius + attribute match), and only creates a brand-new cat record
// once the user confirms it isn't a duplicate.
export function useReportSubmission() {
  const { addCat, addSighting, updateCat, findNearbySightings, getCatById } = useData()
  const [pending, setPending] = useState(null) // { values, candidates }

  const createNewCat = async (values) => {
    const cat = await addCat({
      name: values.name,
      status: values.status,
      description: values.description,
      temperament: values.temperament,
      needs_medical_attention: values.needsMedical,
      medical_details: values.needsMedical ? values.medicalDetails : null,
      primary_photo_url: values.photoDataUrl,
    })
    await addSighting({
      cat_id: cat.id,
      latitude: values.coords.latitude,
      longitude: values.coords.longitude,
      photo_url: values.photoDataUrl,
      last_fed_date: values.lastFedAt,
      notes: values.description,
    })
    return cat
  }

  const linkToExistingCat = async (catId, values) => {
    await addSighting({
      cat_id: catId,
      latitude: values.coords.latitude,
      longitude: values.coords.longitude,
      photo_url: values.photoDataUrl,
      last_fed_date: values.lastFedAt,
      notes: values.description,
    })
    if (values.needsMedical) {
      await updateCat(catId, {
        needs_medical_attention: true,
        medical_details: values.medicalDetails || undefined,
      })
    }
  }

  const submitReport = async (values) => {
    const candidates = findDuplicateCandidates(
      { coords: values.coords, temperament: values.temperament, description: values.description },
      { findNearbySightings, getCatById },
    )

    if (candidates.length > 0) {
      setPending({ values, candidates })
      return { status: 'needs-review' }
    }

    const cat = await createNewCat(values)
    return { status: 'created', cat }
  }

  const confirmSameCat = async (catId) => {
    if (!pending) return
    await linkToExistingCat(catId, pending.values)
    setPending(null)
  }

  const confirmNewCat = async () => {
    if (!pending) return
    await createNewCat(pending.values)
    setPending(null)
  }

  const cancelPending = () => setPending(null)

  return { submitReport, pending, confirmSameCat, confirmNewCat, cancelPending }
}
