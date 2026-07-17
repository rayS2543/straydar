import { useMapEvents } from 'react-leaflet'

// Double-click (desktop) or double-tap (touch, emulated by Leaflet) drops a pending pin.
export function ClickToPin({ onPin }) {
  useMapEvents({
    dblclick(e) {
      onPin({ latitude: e.latlng.lat, longitude: e.latlng.lng })
    },
  })
  return null
}
