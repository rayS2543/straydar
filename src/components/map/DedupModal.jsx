import { X, PawPrint } from 'lucide-react'
import { formatDistance } from '../../services/geo'
import { statusColor, statusLabel } from '../../services/statusMeta'

const STRENGTH_LABEL = {
  strong: 'Likely match',
  possible: 'Possible match',
  nearby: 'Nearby cat',
}

function CandidateCard({ candidate, onConfirm }) {
  const { cat, sighting, distance, strength } = candidate
  const photo = sighting.photo_url || cat.primary_photo_url

  return (
    <div className="flex items-center gap-3 rounded-xl border border-line p-3">
      {photo ? (
        <img src={photo} alt={cat.name} className="h-16 w-16 shrink-0 rounded-lg object-cover" />
      ) : (
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-card-soft text-faint">
          <PawPrint size={22} />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="truncate font-semibold text-ink">{cat.name}</h3>
          <span
            className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
            style={{ backgroundColor: `${statusColor(cat.status)}1a`, color: statusColor(cat.status) }}
          >
            {statusLabel(cat.status)}
          </span>
        </div>
        <p className="truncate text-xs text-muted">{cat.description || 'No description'}</p>
        <p className="text-xs text-faint">
          {formatDistance(distance)} away · {STRENGTH_LABEL[strength]}
        </p>
      </div>
      <button
        type="button"
        onClick={() => onConfirm(cat.id)}
        className="shrink-0 rounded-lg bg-brand px-3 py-2 text-xs font-medium text-white hover:brightness-95"
      >
        Yes, same cat
      </button>
    </div>
  )
}

export function DedupModal({ candidates, onConfirmSame, onConfirmNew, onCancel }) {
  return (
    <div className="fixed inset-0 z-[1000] flex items-end justify-center bg-black/40 sm:items-center">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-card p-5 shadow-xl sm:rounded-2xl">
        <div className="mb-1 flex items-start justify-between">
          <h2 className="text-lg font-semibold text-ink">
            We found similar cats nearby
          </h2>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full p-1.5 text-muted hover:bg-card-soft"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>
        <p className="mb-4 text-sm text-muted">Is this the same cat as one already on the map?</p>

        <div className="space-y-2">
          {candidates.map((candidate) => (
            <CandidateCard key={candidate.cat.id} candidate={candidate} onConfirm={onConfirmSame} />
          ))}
        </div>

        <button
          type="button"
          onClick={onConfirmNew}
          className="mt-4 w-full rounded-lg border border-line py-2.5 text-sm font-medium text-ink hover:bg-card-soft"
        >
          No, this is a different cat
        </button>
      </div>
    </div>
  )
}
