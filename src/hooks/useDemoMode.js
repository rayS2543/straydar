import { useLocation } from 'react-router-dom'

export const DEMO_BASE = '/demo'

// True for /demo and any /demo/* route. Single source of truth for every
// place that needs to branch on demo mode (data backend, nav links, banner).
export function useDemoMode() {
  const { pathname } = useLocation()
  return pathname === DEMO_BASE || pathname.startsWith(`${DEMO_BASE}/`)
}
