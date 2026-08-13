import { HeartPulse } from 'lucide-react'
import { statusColor, statusLabel, TEMPERAMENT_LABELS } from '../../services/statusMeta'

export function CatPopupContent({ cat, sighting }) {
  const photo = sighting.photo_url || cat.primary_photo_url
  const color = statusColor(cat.status)

  return (
    <div className="w-56">
      {photo && (
        <img src={photo} alt={cat.name} className="mb-2 h-28 w-full rounded-lg object-cover" />
      )}
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <h3 className="font-semibold text-ink">{cat.name}</h3>
        <div className="flex shrink-0 items-center gap-1.5">
          {cat.is_seed && (
            <span className="rounded-full bg-card-soft px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-faint">
              Demo
            </span>
          )}
          <span
            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide"
            style={{ backgroundColor: `${color}1a`, color }}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
            {statusLabel(cat.status)}
          </span>
        </div>
      </div>
      {cat.description && <p className="mb-1 text-sm text-muted">{cat.description}</p>}
      <p className="text-xs text-muted">
        Temperament: {TEMPERAMENT_LABELS[cat.temperament] ?? cat.temperament}
      </p>
      {sighting.last_fed_date && (
        <p className="text-xs text-muted">
          Last fed: {new Date(sighting.last_fed_date).toLocaleString()}
        </p>
      )}
      <p className="text-xs text-faint">
        Seen {new Date(sighting.sighting_time).toLocaleString()}
      </p>
      {cat.needs_medical_attention && (
        <p className="mt-1.5 flex items-center gap-1 text-xs font-semibold text-status-lost">
          <HeartPulse size={13} /> Needs medical care
        </p>
      )}
    </div>
  )
}
