import { useMemo, useRef, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { Plus, LocateFixed } from 'lucide-react'
import { useData } from '../context/DataContext'
import { useGeolocation } from '../hooks/useGeolocation'
import { useReportSubmission } from '../hooks/useReportSubmission'
import { useDemoCats } from '../hooks/useDemoCats'
import { useDemoMode } from '../hooks/useDemoMode'
import { DEMO_CENTER } from '../services/demoData'
import { statusIcon, youAreHereIcon } from '../components/map/mapIcons'
import { ClickToPin } from '../components/map/ClickToPin'
import { AddReportModal } from '../components/map/AddReportModal'
import { DedupModal } from '../components/map/DedupModal'
import { CatPopupContent } from '../components/map/CatPopupContent'
import { CatDetailModal } from '../components/map/CatDetailModal'
import { STATUS_META } from '../services/statusMeta'

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
  const { cats, sightings, loading, updateCat, getCatById, getSightingsForCat } = useData()
  const [selectedCatId, setSelectedCatId] = useState(null)
  const demo = useDemoMode()
  const { position: geoPosition, error: geoError } = useGeolocation()
  // /demo never blocks on location access — it always has DEMO_CENTER to fall
  // back to, so the demo is one click, no permission prompt required.
  const position = demo ? geoPosition || DEMO_CENTER : geoPosition
  const { submitReport, pending, confirmSameCat, confirmNewCat, cancelPending } = useReportSubmission()
  const mapRef = useRef(null)
  const [pendingPin, setPendingPin] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  // `is_seed` cats are the old static SF demo rows from 0002_seed.sql —
  // they don't count as "real" reports, so they never block the
  // location-based demo fallback below, and don't show up hundreds of km
  // from wherever someone actually opens the app.
  const realMarkers = useMemo(() => {
    const latest = latestSightingByCat(sightings)
    return cats
      .filter((cat) => demo || !cat.is_seed)
      .map((cat) => {
        const sighting = latest.get(cat.id)
        return sighting ? { cat, sighting } : null
      })
      .filter(Boolean)
  }, [cats, sightings, demo])

  // Client-side-only filler for when there are no real reports yet — never
  // written to Supabase, so it's invisible to every other browser. Always
  // anchored to the visitor's real position. Not used on /demo: there, the
  // demo neighborhood already comes from DataContext's demo-mode cats.
  const demoMarkers = useDemoCats(position, demo || (!loading && realMarkers.length > 0))
  const showDemo = demoMarkers.length > 0

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
        : { latitude: position.latitude, longitude: position.longitude },
    )
  }

  const handleLocate = () => {
    if (!mapRef.current) return
    mapRef.current.flyTo([position.latitude, position.longitude], 16)
  }

  if (geoError && !demo) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="text-sm font-medium text-ink">Location access is needed to show cats near you.</p>
        <p className="max-w-xs text-xs text-muted">
          Straydar centers on your real location instead of a fixed city. Enable location access for this
          site in your browser settings, then reload.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded-full bg-brand px-4 py-2 text-xs font-semibold text-white shadow-lg hover:brightness-95"
        >
          Try again
        </button>
      </div>
    )
  }

  if (!position) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="rounded-full border border-line bg-card/95 px-3 py-1.5 text-xs font-medium text-muted shadow-sm backdrop-blur">
          Finding your location…
        </div>
      </div>
    )
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
        center={[position.latitude, position.longitude]}
        zoom={15}
        doubleClickZoom={false}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClickToPin onPin={setPendingPin} />

        {realMarkers.map(({ cat, sighting }) => (
          <Marker
            key={cat.id}
            position={[sighting.latitude, sighting.longitude]}
            icon={statusIcon(cat.status)}
          >
            <Popup>
              <CatPopupContent cat={cat} sighting={sighting} onViewDetails={setSelectedCatId} />
            </Popup>
          </Marker>
        ))}

        {demoMarkers.map(({ cat, sighting }) => (
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

        <Marker position={[position.latitude, position.longitude]} icon={youAreHereIcon()} />
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
        <button
          type="button"
          onClick={handleLocate}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-line bg-card text-muted shadow-lg hover:text-ink"
          aria-label="Center on my location"
        >
          <LocateFixed size={20} />
        </button>
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

      {showDemo && (
        <p className="pointer-events-none absolute bottom-2 left-2 z-[500] text-[10px] text-faint">
          Straydar — demo version
        </p>
      )}

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

      {selectedCatId && (
        <CatDetailModal
          cat={getCatById(selectedCatId)}
          sightings={getSightingsForCat(selectedCatId)}
          onMarkReunited={async (catId) => {
            await updateCat(catId, { status: 'found' })
            setSelectedCatId(null)
          }}
          onClose={() => setSelectedCatId(null)}
        />
      )}
    </div>
  )
}
