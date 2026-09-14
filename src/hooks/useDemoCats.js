import { useMemo } from 'react'
import { generateDemoCats } from '../services/demoData'

// Local-only demo cat/sighting pairs anchored to `position`, used only when
// `hasRealData` is false (e.g. no non-seed reports exist yet). Rounds the
// position so GPS jitter from watchPosition doesn't keep regenerating them.
export function useDemoCats(position, hasRealData) {
  const originKey = position
    ? `${position.latitude.toFixed(3)},${position.longitude.toFixed(3)}`
    : null

  return useMemo(() => {
    if (hasRealData || !originKey) return []
    const [latitude, longitude] = originKey.split(',').map(Number)
    const { cats, sightings } = generateDemoCats({ latitude, longitude })
    return cats.map((cat, index) => ({ cat, sighting: sightings[index] }))
  }, [hasRealData, originKey])
}
