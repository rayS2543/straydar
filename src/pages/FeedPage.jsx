import { useEffect, useMemo, useRef, useState } from 'react'
import { HeartPulse, MapPin, PawPrint } from 'lucide-react'
import { useData } from '../context/DataContext'
import { useGeolocation } from '../hooks/useGeolocation'
import { useDemoCats } from '../hooks/useDemoCats'
import { distanceMeters, formatDistance } from '../services/geo'
import { statusColor, statusLabel } from '../services/statusMeta'

const PAGE_SIZE = 6

function FeedCard({ cat, sighting, distance }) {
  const photo = sighting.photo_url || cat?.primary_photo_url

  return (
    <article className="overflow-hidden rounded-2xl border border-line bg-card shadow-sm">
      {photo ? (
        <img src={photo} alt={cat?.name} className="h-44 w-full object-cover" />
      ) : (
        <div className="flex h-44 w-full items-center justify-center bg-card-soft text-faint">
          <PawPrint size={32} />
        </div>
      )}
      <div className="p-3">
        <div className="mb-1 flex items-center justify-between gap-2">
          <h3 className="font-semibold text-ink">{cat?.name ?? 'Unknown Cat'}</h3>
          <div className="flex shrink-0 items-center gap-1.5">
            {cat?.is_seed && (
              <span className="rounded-full bg-card-soft px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-faint">
                Demo
              </span>
            )}
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
              style={{ backgroundColor: `${statusColor(cat?.status)}1a`, color: statusColor(cat?.status) }}
            >
              {statusLabel(cat?.status)}
            </span>
          </div>
        </div>
        {sighting.notes && <p className="mb-1 text-sm text-muted">{sighting.notes}</p>}
        <div className="flex items-center justify-between text-xs text-faint">
          <span>{new Date(sighting.sighting_time).toLocaleString()}</span>
          {distance != null && (
            <span className="flex items-center gap-1">
              <MapPin size={11} />
              {formatDistance(distance)} away
            </span>
          )}
        </div>
        {cat?.needs_medical_attention && (
          <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-status-lost">
            <HeartPulse size={13} /> Needs medical care
          </p>
        )}
      </div>
    </article>
  )
}

export default function FeedPage() {
  const { sightings, getCatById } = useData()
  const { position } = useGeolocation()
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const sentinelRef = useRef(null)

  // `is_seed` cats are the old static SF demo rows — they don't count as
  // real reports, so they don't block the location-based demo fallback and
  // don't show up hundreds of km from wherever the visitor actually is.
  const realEntries = useMemo(() => {
    return sightings
      .map((sighting) => ({ sighting, cat: getCatById(sighting.cat_id) }))
      .filter(({ cat }) => !cat?.is_seed)
      .sort((a, b) => new Date(b.sighting.sighting_time) - new Date(a.sighting.sighting_time))
  }, [sightings, getCatById])

  const demoEntries = useDemoCats(position, realEntries.length > 0)
  const entries = realEntries.length > 0 ? realEntries : demoEntries

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(
      (observerEntries) => {
        if (observerEntries[0].isIntersecting) {
          setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, entries.length))
        }
      },
      { rootMargin: '200px' },
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [entries.length])

  const visibleEntries = entries.slice(0, visibleCount)

  return (
    <div className="mx-auto max-w-2xl p-4 sm:p-6">
      <h1 className="mb-1 text-xl font-semibold text-ink">Community Feed</h1>
      <p className="mb-4 text-sm text-muted">Recent sightings and reports, newest first.</p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {visibleEntries.map(({ sighting, cat }) => (
          <FeedCard
            key={sighting.id}
            sighting={sighting}
            cat={cat}
            distance={position ? distanceMeters(position, sighting) : null}
          />
        ))}
      </div>

      {visibleCount < entries.length && (
        <div ref={sentinelRef} className="py-6 text-center text-sm text-faint">
          Loading more…
        </div>
      )}
    </div>
  )
}
