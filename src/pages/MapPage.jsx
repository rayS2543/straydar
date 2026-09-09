import { useEffect, useMemo, useRef, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { Plus, LocateFixed } from 'lucide-react'
import { useData } from '../context/DataContext'
import { useGeolocation } from '../hooks/useGeolocation'
import { useReportSubmission } from '../hooks/useReportSubmission'
import { CENTER as SEED_CENTER } from '../services/seedData'
import { statusIcon, youAreHereIcon } from '../components/map/mapIcons'
import { ClickToPin } from '../components/map/ClickToPin'
import { AddReportModal } from '../components/map/AddReportModal'
import { DedupModal } from '../components/map/DedupModal'
import { CatPopupContent } from '../components/map/CatPopupContent'
import { STATUS_META } from '../services/statusMeta'

// Recenters the map on the user's real position the first time it resolves,
// without fighting subsequent pans/watchPosition updates.
function AutoLocate({ position }) {
  const map = useMap()
  const hasCentered = useRef(false)

  useEffect(() => {
    if (position && !hasCentered.current) {
      hasCentered.current = true
      map.setView([position.latitude, position.longitude], 15)
    }
  }, [position, map])

  return null
}

function latestSightingByCat(sightings) {
  const map = new Map()
  for (const sighting of sightings) {
    if (!sighting.cat_id) continue
    const existing = map.get(sighting.cat_id)
    if (!existing || new Date(sighting.sighting_time) > new Date(existing.sighting_time)) {
      map.set(sighting.cat_id, sighting)
    }
  }
  return map
}

export default function MapPage() {
  const { cats, sightings, loading } = useData()
  const { position } = useGeolocation()
  const { submitReport, pending, confirmSameCat, confirmNewCat, cancelPending } = useReportSubmission()
  const mapRef = useRef(null)
  const [pendingPin, setPendingPin] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const initialCenter = position ?? SEED_CENTER

  const markers = useMemo(() => {
    const latest = latestSightingByCat(sightings)
    return cats
      .map((cat) => {
        const sighting = latest.get(cat.id)
        return sighting ? { cat, sighting } : null
      })
      .filter(Boolean)
  }, [cats, sightings])

  const handleSubmit = async (values) => {
    setSubmitting(true)
    const result = await submitReport(values)
    setSubmitting(false)
    if (result.status === 'created') {
      setPendingPin(null)
    }
    // 'needs-review' keeps pendingPin (so the dropped pin stays visible)
    // and hands off to the DedupModal via the `pending` state below.
  }

  const handleConfirmSame = async (catId) => {
    await confirmSameCat(catId)
    setPendingPin(null)
  }

  const handleConfirmNew = async () => {
    await confirmNewCat()
    setPendingPin(null)
  }

  const handleCancelDedup = () => {
    cancelPending()
    setPendingPin(null)
  }

  const handleAddClick = () => {
    const center = mapRef.current?.getCenter()
    setPendingPin(
      center
        ? { latitude: center.lat, longitude: center.lng }
        : { latitude: initialCenter.latitude, longitude: initialCenter.longitude },
    )
  }

  const handleLocate = () => {
    if (!position || !mapRef.current) return
    mapRef.current.flyTo([position.latitude, position.longitude], 16)
  }

  return (
    <div className="relative h-full w-full">
      {loading && (
        <div className="pointer-events-none absolute inset-x-0 top-0 z-[500] flex justify-center p-3">
          <div className="rounded-full border border-line bg-card/95 px-3 py-1.5 text-xs font-medium text-muted shadow-sm backdrop-blur">
            Loading map…
          </div>
        </div>
      )}
      <MapContainer
        ref={mapRef}
        center={[initialCenter.latitude, initialCenter.longitude]}
        zoom={15}
        doubleClickZoom={false}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClickToPin onPin={setPendingPin} />
        <AutoLocate position={position} />

        {markers.map(({ cat, sighting }) => (
          <Marker
            key={cat.id}
            position={[sighting.latitude, sighting.longitude]}
            icon={statusIcon(cat.status)}
          >
            <Popup>
              <CatPopupContent cat={cat} sighting={sighting} />
            </Popup>
          </Marker>
        ))}

        {pendingPin && (
          <Marker
            position={[pendingPin.latitude, pendingPin.longitude]}
            icon={statusIcon('pending', { pending: true })}
          />
        )}

        {position && (
          <Marker position={[position.latitude, position.longitude]} icon={youAreHereIcon()} />
        )}
      </MapContainer>

      <div className="pointer-events-none absolute inset-x-0 top-0 z-[500] flex justify-center p-3 sm:justify-start">
        <div className="pointer-events-auto flex flex-wrap gap-2 rounded-full border border-line bg-card/95 px-3 py-1.5 text-[11px] font-medium text-ink shadow-sm backdrop-blur">
          {Object.entries(STATUS_META).map(([key, meta]) => (
            <span key={key} className="flex items-center gap-1">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: meta.color }}
              />
              {meta.label}
            </span>
          ))}
        </div>
      </div>

      <div className="absolute bottom-20 right-4 z-[500] flex flex-col gap-2 md:bottom-6">
        {position && (
          <button
            type="button"
            onClick={handleLocate}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-line bg-card text-muted shadow-lg hover:text-ink"
            aria-label="Center on my location"
          >
            <LocateFixed size={20} />
          </button>
        )}
        <button
          type="button"
          onClick={handleAddClick}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-brand text-white shadow-lg hover:brightness-95"
          aria-label="Add report"
        >
          <Plus size={22} />
        </button>
      </div>

      <p className="pointer-events-none absolute bottom-20 left-1/2 z-[500] hidden -translate-x-1/2 rounded-full bg-ink/80 px-3 py-1 text-xs text-white sm:block md:bottom-6">
        Double-click the map to drop a pin, or use the + button
      </p>

      {pendingPin && !pending && (
        <AddReportModal
          coords={pendingPin}
          onCancel={() => setPendingPin(null)}
          onSubmit={handleSubmit}
          submitting={submitting}
        />
      )}

      {pending && (
        <DedupModal
          candidates={pending.candidates}
          onConfirmSame={handleConfirmSame}
          onConfirmNew={handleConfirmNew}
          onCancel={handleCancelDedup}
        />
      )}
    </div>
  )
}
