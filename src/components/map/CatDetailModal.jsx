import { X, PawPrint } from 'lucide-react'
import { statusColor, statusLabel } from '../../services/statusMeta'

export function CatDetailModal({ cat, sightings, onMarkReunited, onClose }) {
  const photo = cat.primary_photo_url || sightings[0]?.photo_url
  const color = statusColor(cat.status)

  return (
    <div className="fixed inset-0 z-[1000] flex items-end justify-center bg-black/40 sm:items-center">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-card p-5 shadow-xl sm:rounded-2xl">
        <div className="mb-3 flex items-start justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold text-ink">{cat.name}</h2>
            <span
              className="mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide"
              style={{ backgroundColor: `${color}1a`, color }}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
              {statusLabel(cat.status)}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-muted hover:bg-card-soft"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {photo && <img src={photo} alt={cat.name} className="mb-3 h-40 w-full rounded-lg object-cover" />}
        {cat.description && <p className="mb-3 text-sm text-muted">{cat.description}</p>}

        {cat.status === 'lost' && (
          <button
            type="button"
            onClick={() => onMarkReunited(cat.id)}
            className="mb-4 w-full rounded-lg bg-brand py-2.5 text-sm font-semibold text-white hover:brightness-95"
          >
            Mark as reunited
          </button>
        )}

        <h3 className="mb-2 text-sm font-semibold text-ink">Sighting timeline</h3>
        <div className="space-y-2">
          {sightings.length === 0 && <p className="text-sm text-muted">No sightings recorded yet.</p>}
          {sightings.map((sighting) => (
            <div key={sighting.id} className="flex gap-3 rounded-xl border border-line p-3">
              {sighting.photo_url ? (
                <img
                  src={sighting.photo_url}
                  alt=""
                  className="h-12 w-12 shrink-0 rounded-lg object-cover"
                />
              ) : (
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-card-soft text-faint">
                  <PawPrint size={16} />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-ink">
                  {new Date(sighting.sighting_time).toLocaleString()}
                </p>
                {sighting.notes && <p className="truncate text-xs text-muted">{sighting.notes}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
