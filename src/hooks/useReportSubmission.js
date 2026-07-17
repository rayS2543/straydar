import { useData } from '../context/DataContext'

// Directly creates a new cat + sighting from an Add Report form submission.
// Phase 4 wraps this with a nearby-match check before it runs.
export function useReportSubmission() {
  const { addCat, addSighting } = useData()

  const submitReport = (values) => {
    const cat = addCat({
      name: values.name,
      status: values.status,
      description: values.description,
      temperament: values.temperament,
      needs_medical_attention: values.needsMedical,
      medical_details: values.needsMedical ? values.medicalDetails : null,
      primary_photo_url: values.photoDataUrl,
    })
    addSighting({
      cat_id: cat.id,
      latitude: values.coords.latitude,
      longitude: values.coords.longitude,
      photo_url: values.photoDataUrl,
      last_fed_date: values.lastFedAt,
      notes: values.description,
    })
    return cat
  }

  return { submitReport }
}
