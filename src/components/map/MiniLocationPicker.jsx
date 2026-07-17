import { MapContainer, TileLayer, Marker } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { ClickToPin } from './ClickToPin'
import { statusIcon } from './mapIcons'

export function MiniLocationPicker({ center, coords, onPick }) {
  return (
    <div className="h-52 w-full overflow-hidden rounded-xl border border-line">
      <MapContainer
        center={[center.latitude, center.longitude]}
        zoom={15}
        doubleClickZoom={false}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClickToPin onPin={onPick} />
        {coords && (
          <Marker
            position={[coords.latitude, coords.longitude]}
            icon={statusIcon('lost')}
          />
        )}
      </MapContainer>
    </div>
  )
}
