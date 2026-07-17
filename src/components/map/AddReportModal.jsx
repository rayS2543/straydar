import { useState } from 'react'
import { X, Camera, MapPin } from 'lucide-react'

const STATUS_OPTIONS = [
  { value: 'sighted_temporary', label: 'Sighting (unverified)' },
  { value: 'stray_resident', label: 'Stray Resident / Colony' },
]

const TEMPERAMENT_OPTIONS = ['friendly', 'skittish', 'feral', 'unknown']

const emptyForm = {
  name: '',
  status: 'sighted_temporary',
  description: '',
  temperament: 'unknown',
  lastFedAt: '',
  needsMedical: false,
  medicalDetails: '',
  photoDataUrl: null,
}

export function AddReportModal({ coords, onCancel, onSubmit, submitting = false }) {
  const [form, setForm] = useState(emptyForm)

  const update = (patch) => setForm((prev) => ({ ...prev, ...patch }))

  const handlePhoto = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => update({ photoDataUrl: reader.result })
    reader.readAsDataURL(file)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit({
      name: form.name.trim() || 'Unknown Cat',
      status: form.status,
      description: form.description.trim(),
      temperament: form.temperament,
      lastFedAt: form.lastFedAt ? new Date(form.lastFedAt).toISOString() : null,
      needsMedical: form.needsMedical,
      medicalDetails: form.needsMedical ? form.medicalDetails.trim() : '',
      photoDataUrl: form.photoDataUrl,
      coords,
    })
  }

  return (
    <div className="fixed inset-0 z-[1000] flex items-end justify-center bg-black/40 sm:items-center">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-card p-5 shadow-xl sm:rounded-2xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-ink">Add Report</h2>
            <p className="flex items-center gap-1 text-xs text-muted">
              <MapPin size={13} />
              {coords.latitude.toFixed(5)}, {coords.longitude.toFixed(5)}
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full p-1.5 text-muted hover:bg-card-soft"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

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
            <label className="mb-1 block text-sm font-medium text-ink">Name (optional)</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => update({ name: e.target.value })}
              placeholder="Unknown Cat"
              className="w-full rounded-lg border border-line px-3 py-2 text-sm focus:border-brand focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-ink">Report type</label>
            <select
              value={form.status}
              onChange={(e) => update({ status: e.target.value })}
              className="w-full rounded-lg border border-line px-3 py-2 text-sm focus:border-brand focus:outline-none"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-ink">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => update({ description: e.target.value })}
              rows={3}
              placeholder="Orange tabby, friendly, hanging around the mailboxes..."
              className="w-full rounded-lg border border-line px-3 py-2 text-sm focus:border-brand focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-ink">Temperament</label>
              <select
                value={form.temperament}
                onChange={(e) => update({ temperament: e.target.value })}
                className="w-full rounded-lg border border-line px-3 py-2 text-sm focus:border-brand focus:outline-none"
              >
                {TEMPERAMENT_OPTIONS.map((t) => (
                  <option key={t} value={t}>
                    {t[0].toUpperCase() + t.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-ink">Last fed</label>
              <input
                type="datetime-local"
                value={form.lastFedAt}
                onChange={(e) => update({ lastFedAt: e.target.value })}
                className="w-full rounded-lg border border-line px-3 py-2 text-sm focus:border-brand focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-line px-3 py-2.5">
            <span className="text-sm font-medium text-ink">Needs medical care</span>
            <button
              type="button"
              role="switch"
              aria-checked={form.needsMedical}
              onClick={() => update({ needsMedical: !form.needsMedical })}
              className={`relative h-6 w-11 rounded-full transition-colors ${
                form.needsMedical ? 'bg-status-lost' : 'bg-line'
              }`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                  form.needsMedical ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          {form.needsMedical && (
            <textarea
              value={form.medicalDetails}
              onChange={(e) => update({ medicalDetails: e.target.value })}
              rows={2}
              placeholder="What's wrong? (visible wound, limping, etc.)"
              className="w-full rounded-lg border border-status-lost/30 bg-status-lost/5 px-3 py-2 text-sm focus:border-status-lost focus:outline-none"
            />
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 rounded-lg border border-line py-2.5 text-sm font-medium text-ink hover:bg-card-soft"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 rounded-lg bg-brand py-2.5 text-sm font-medium text-white hover:brightness-95 disabled:opacity-60"
            >
              {submitting ? 'Saving…' : 'Submit Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
