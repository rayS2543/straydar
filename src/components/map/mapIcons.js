import L from 'leaflet'
import { statusColor } from '../../services/statusMeta'

const iconCache = new Map()

function pinSvg(color) {
  return `
    <svg width="30" height="40" viewBox="0 0 30 40" xmlns="http://www.w3.org/2000/svg">
      <path d="M15 0C6.7 0 0 6.7 0 15c0 10.5 15 25 15 25s15-14.5 15-25C30 6.7 23.3 0 15 0z"
            fill="${color}" stroke="white" stroke-width="1.5"/>
      <circle cx="15" cy="15" r="6" fill="white"/>
    </svg>
  `
}

export function statusIcon(status, { pending = false } = {}) {
  const color = pending ? '#c97a1a' : statusColor(status)
  const key = `${status}:${pending}`
  if (iconCache.has(key)) return iconCache.get(key)

  const icon = L.divIcon({
    className: pending ? 'straydar-pin straydar-pin-pending' : 'straydar-pin',
    html: pinSvg(color),
    iconSize: [30, 40],
    iconAnchor: [15, 40],
    popupAnchor: [0, -36],
  })
  iconCache.set(key, icon)
  return icon
}

export function youAreHereIcon() {
  const key = 'you-are-here'
  if (iconCache.has(key)) return iconCache.get(key)

  const icon = L.divIcon({
    className: 'straydar-you-are-here',
    html: `
      <span style="
        display:block;width:16px;height:16px;border-radius:9999px;
        background:#2563eb;border:3px solid white;
        box-shadow:0 0 0 2px rgba(37,99,235,0.5);
      "></span>
    `,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  })
  iconCache.set(key, icon)
  return icon
}
