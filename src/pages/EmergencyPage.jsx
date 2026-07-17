import { useMemo, useState } from 'react'
import { Phone, MapPin, MessageCircle } from 'lucide-react'
import { useGeolocation } from '../hooks/useGeolocation'
import { VET_CLINICS } from '../services/vetDirectory'
import { CENTER as SEED_CENTER } from '../services/seedData'
import { distanceMeters, formatDistance } from '../services/geo'
import { AIChatPanel } from '../components/chat/AIChatPanel'

export default function EmergencyPage() {
  const { position } = useGeolocation()
  const [chatOpen, setChatOpen] = useState(false)
  const origin = position ?? SEED_CENTER

  const nearestClinics = useMemo(() => {
    return VET_CLINICS.map((clinic) => ({
      ...clinic,
      distance: distanceMeters(origin, clinic),
    }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 5)
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

      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-faint">
        5 Closest Emergency Vets
      </h2>
      <ul className="space-y-2">
        {nearestClinics.map((clinic) => (
          <li
            key={clinic.id}
            className="flex items-center justify-between gap-3 rounded-xl border border-line bg-card p-3"
          >
            <div className="min-w-0">
              <p className="truncate font-medium text-ink">{clinic.name}</p>
              <p className="truncate text-xs text-muted">{clinic.address}</p>
              <p className="flex items-center gap-1 text-xs text-faint">
                <MapPin size={11} />
                {formatDistance(clinic.distance)} away
              </p>
            </div>
            <a
              href={`tel:${clinic.phone.replace(/[^\d+]/g, '')}`}
              className="flex shrink-0 items-center gap-1.5 rounded-full bg-brand-soft px-3 py-2 text-xs font-medium text-brand hover:brightness-95"
            >
              <Phone size={13} />
              Call
            </a>
          </li>
        ))}
      </ul>

      <AIChatPanel open={chatOpen} onClose={() => setChatOpen(false)} />
    </div>
  )
}
