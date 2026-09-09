import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Camera, MapPin, LocateFixed, CheckCircle2 } from 'lucide-react'
import { useData } from '../context/DataContext'
import { useGeolocation } from '../hooks/useGeolocation'
import { CENTER as SEED_CENTER } from '../services/seedData'
import { MiniLocationPicker } from '../components/map/MiniLocationPicker'

const emptyForm = {
  name: '',
  description: '',
  photoDataUrl: null,
  ownerName: '',
  ownerContact: '',
  microchipNumber: '',
  rewardDetails: '',
}

export default function MissingPage() {
  const { addCat, addSighting } = useData()
  const { position } = useGeolocation()
  const navigate = useNavigate()

  const [form, setForm] = useState(emptyForm)
  const [coords, setCoords] = useState(null)
  const [submittedCat, setSubmittedCat] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const center = position ?? SEED_CENTER
  const update = (patch) => setForm((prev) => ({ ...prev, ...patch }))

  const handlePhoto = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => update({ photoDataUrl: reader.result })
    reader.readAsDataURL(file)
  }

  const handleUseCurrentLocation = () => {
    if (position) setCoords(position)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!coords || submitting) return
    setSubmitting(true)

    try {
      const cat = await addCat({
        name: form.name.trim() || 'Unknown Cat',
        status: 'lost',
        description: form.description.trim(),
        primary_photo_url: form.photoDataUrl,
        owner_name: form.ownerName.trim() || null,
        owner_contact: form.ownerContact.trim() || null,
        microchip_number: form.microchipNumber.trim() || null,
        reward_details: form.rewardDetails.trim() || null,
      })
      await addSighting({
        cat_id: cat.id,
        latitude: coords.latitude,
        longitude: coords.longitude,
        photo_url: form.photoDataUrl,
        notes: 'Last known location',
      })

      setSubmittedCat(cat)
    } finally {
      setSubmitting(false)
    }
  }

  if (submittedCat) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="max-w-sm rounded-2xl border border-line bg-card p-6 text-center shadow-sm">
          <CheckCircle2 className="mx-auto mb-3 text-status-resident" size={40} />
          <h2 className="mb-1 text-lg font-semibold text-ink">Report submitted</h2>
          <p className="mb-4 text-sm text-muted">
            {submittedCat.name}&rsquo;s missing report is now live on the map so the community can
            help keep an eye out.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setForm(emptyForm)
                setCoords(null)
                setSubmittedCat(null)
              }}
              className="flex-1 rounded-lg border border-line py-2.5 text-sm font-medium text-ink hover:bg-card-soft"
            >
              Report another
            </button>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="flex-1 rounded-lg bg-brand py-2.5 text-sm font-medium text-white hover:brightness-95"
            >
              View on Map
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl p-4 sm:p-6">
      <h1 className="mb-1 text-xl font-semibold text-ink">Report a Missing Cat</h1>
      <p className="mb-5 text-sm text-muted">
        Get the word out to nearby neighbors so they can help watch for your cat.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-line bg-card-soft py-6 text-muted hover:border-brand hover:text-brand">
          {form.photoDataUrl ? (
            <img
              src={form.photoDataUrl}
              alt="Preview"
              className="h-32 w-32 rounded-lg object-cover"
            />
          ) : (
            <>
              <Camera size={28} />
              <span className="text-sm">Add a photo</span>
            </>
          )}
          <input type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
        </label>

        <div>
          <label className="mb-1 block text-sm font-medium text-ink">Cat&rsquo;s name</label>
          <input
            type="text"
            required
            value={form.name}
            onChange={(e) => update({ name: e.target.value })}
            placeholder="Biscuit"
            className="w-full rounded-lg border border-line px-3 py-2 text-sm focus:border-brand focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-ink">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => update({ description: e.target.value })}
            rows={3}
            placeholder="Breed, color, distinguishing marks, collar..."
            className="w-full rounded-lg border border-line px-3 py-2 text-sm focus:border-brand focus:outline-none"
          />
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between">
            <label className="block text-sm font-medium text-ink">Last known location</label>
            {position && (
              <button
                type="button"
                onClick={handleUseCurrentLocation}
                className="flex items-center gap-1 text-xs font-medium text-brand hover:underline"
              >
                <LocateFixed size={13} /> Use my location
              </button>
            )}
          </div>
          <MiniLocationPicker center={center} coords={coords} onPick={setCoords} />
          <p className="mt-1 flex items-center gap-1 text-xs text-faint">
            <MapPin size={12} />
            {coords
              ? `${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}`
              : 'Double-click the map to drop a pin'}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">Owner name</label>
            <input
              type="text"
              value={form.ownerName}
              onChange={(e) => update({ ownerName: e.target.value })}
              className="w-full rounded-lg border border-line px-3 py-2 text-sm focus:border-brand focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">Contact (phone/email)</label>
            <input
              type="text"
              value={form.ownerContact}
              onChange={(e) => update({ ownerContact: e.target.value })}
              className="w-full rounded-lg border border-line px-3 py-2 text-sm focus:border-brand focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">Microchip number</label>
            <input
              type="text"
              value={form.microchipNumber}
              onChange={(e) => update({ microchipNumber: e.target.value })}
              className="w-full rounded-lg border border-line px-3 py-2 text-sm focus:border-brand focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">Reward details</label>
            <input
              type="text"
              value={form.rewardDetails}
              onChange={(e) => update({ rewardDetails: e.target.value })}
              placeholder="$100 reward"
              className="w-full rounded-lg border border-line px-3 py-2 text-sm focus:border-brand focus:outline-none"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={!coords || submitting}
          className="w-full rounded-lg bg-brand py-2.5 text-sm font-medium text-white hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? 'Submitting…' : 'Submit Missing Report'}
        </button>
      </form>
    </div>
  )
}
