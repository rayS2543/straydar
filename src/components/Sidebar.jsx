import { NavLink } from 'react-router-dom'
import { MapPin, Rss, Search, Stethoscope, PawPrint } from 'lucide-react'

const NAV_ITEMS = [
  { to: '/', label: 'Map', icon: MapPin, end: true },
  { to: '/feed', label: 'Feed', icon: Rss },
  { to: '/missing', label: 'Missing', icon: Search },
  { to: '/emergency', label: 'Emergency / AI', icon: Stethoscope },
]

function NavItems({ onNavigate, layout }) {
  return NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
    <NavLink
      key={to}
      to={to}
      end={end}
      onClick={onNavigate}
      className={({ isActive }) =>
        [
          'flex items-center gap-3 rounded-xl transition-colors',
          layout === 'rail'
            ? 'flex-col justify-center gap-1 px-2 py-2 text-[11px]'
            : 'px-3 py-2.5 text-sm font-medium',
          isActive
            ? 'bg-emerald-100 text-emerald-800'
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
        ].join(' ')
      }
    >
      <Icon size={layout === 'rail' ? 20 : 18} strokeWidth={2} />
      <span>{label}</span>
    </NavLink>
  ))
}

export function DesktopSidebar() {
  return (
    <aside className="hidden md:flex md:w-60 md:flex-col md:border-r md:border-slate-200 md:bg-white md:px-3 md:py-5">
      <div className="mb-6 flex items-center gap-2 px-2">
        <PawPrint className="text-emerald-600" size={26} />
        <span className="text-lg font-semibold text-slate-900">Straydar</span>
      </div>
      <nav className="flex flex-1 flex-col gap-1">
        <NavItems layout="stacked" />
      </nav>
      <p className="px-2 text-xs text-slate-400">
        Map, report, and help stray &amp; lost cats nearby.
      </p>
    </aside>
  )
}

export function MobileTabBar() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-slate-200 bg-white/95 backdrop-blur md:hidden">
      <div className="flex w-full justify-around py-1">
        <NavItems layout="rail" />
      </div>
    </nav>
  )
}
