import { useEffect, useRef, useState } from 'react'
import { Phone, MapPin, MessageCircle, Loader2 } from 'lucide-react'
import { useGeolocation } from '../hooks/useGeolocation'
import { VET_CLINICS } from '../services/vetDirectory'
import { findNearbyVets } from '../services/vetLookup'
import { CENTER as SEED_CENTER } from '../services/seedData'
import { distanceMeters, formatDistance } from '../services/geo'
import { AIChatPanel } from '../components/chat/AIChatPanel'

// Only refetch live vets once the origin has moved meaningfully, so GPS
// jitter from watchPosition doesn't spam the Overpass API.
const REFETCH_THRESHOLD_METERS = 1000

export default function EmergencyPage() {
  const { position } = useGeolocation()
  const [chatOpen, setChatOpen] = useState(false)
  const [clinics, setClinics] = useState([])
  const [loading, setLoading] = useState(true)
  const [usingFallback, setUsingFallback] = useState(false)
  const lastFetchOrigin = useRef(null)
  const origin = position ?? SEED_CENTER

  useEffect(() => {
    if (
      lastFetchOrigin.current &&
      distanceMeters(lastFetchOrigin.current, origin) < REFETCH_THRESHOLD_METERS
    ) {
      return
    }
    lastFetchOrigin.current = origin

    let cancelled = false
    setLoading(true)

    findNearbyVets(origin)
      .then((vets) => {
        if (cancelled) return
        if (vets.length === 0) throw new Error('No live results')
        setClinics(
          vets
            .map((vet) => ({ ...vet, distance: distanceMeters(origin, vet) }))
            .sort((a, b) => a.distance - b.distance)
            .slice(0, 5),
        )
        setUsingFallback(false)
      })
      .catch(() => {
        if (cancelled) return
        setClinics(
          VET_CLINICS.map((clinic) => ({ ...clinic, distance: distanceMeters(origin, clinic) }))
            .sort((a, b) => a.distance - b.distance)
            .slice(0, 5),
        )
        setUsingFallback(true)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [origin])

  return (
    <div className="mx-auto max-w-2xl p-4 sm:p-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-ink">Emergency &amp; AI Help</h1>
          <p className="text-sm text-muted">
            Closest emergency vets, plus an AI assistant for rescue guidance.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setChatOpen(true)}
          className="flex shrink-0 items-center gap-2 rounded-full bg-brand px-4 py-2.5 text-sm font-medium text-white hover:brightness-95"
        >
          <MessageCircle size={16} />
          Ask AI
        </button>
      </div>

      <div className="mb-2 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-faint">
          5 Closest Vets
        </h2>
        {loading && <Loader2 size={14} className="animate-spin text-faint" />}
      </div>

      {usingFallback && !loading && (
        <p className="mb-2 text-xs text-faint">
          Live results unavailable — showing demo clinics near the sample area instead.
        </p>
      )}
      {!usingFallback && !loading && (
        <p className="mb-2 text-xs text-faint">Sourced from OpenStreetMap.</p>
      )}

      <ul className="space-y-2">
        {clinics.map((clinic) => (
          <li
            key={clinic.id}
            className="flex items-center justify-between gap-3 rounded-xl border border-line bg-card p-3"
          >
            <div className="min-w-0">
              <p className="truncate font-medium text-ink">{clinic.name}</p>
              {clinic.address && <p className="truncate text-xs text-muted">{clinic.address}</p>}
              <p className="flex items-center gap-1 text-xs text-faint">
                <MapPin size={11} />
                {formatDistance(clinic.distance)} away
              </p>
            </div>
            {clinic.phone ? (
              <a
                href={`tel:${clinic.phone.replace(/[^\d+]/g, '')}`}
                className="flex shrink-0 items-center gap-1.5 rounded-full bg-brand-soft px-3 py-2 text-xs font-medium text-brand hover:brightness-95"
              >
                <Phone size={13} />
                Call
              </a>
            ) : (
              <span className="shrink-0 text-xs text-faint">No phone listed</span>
            )}
          </li>
        ))}
      </ul>

      <AIChatPanel open={chatOpen} onClose={() => setChatOpen(false)} />
    </div>
  )
}
