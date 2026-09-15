import { Link } from 'react-router-dom'
import { PawPrint } from 'lucide-react'
import { useDemoMode, DEMO_BASE } from '../hooks/useDemoMode'

export function MobileHeader() {
  const demo = useDemoMode()
  return (
    <header className="sticky top-0 z-20 flex items-center gap-2.5 border-b border-line bg-card/95 px-4 py-3 backdrop-blur md:hidden">
      <span className="relative flex h-6 w-6 items-center justify-center rounded-full border-[1.5px] border-brand">
        <PawPrint className="text-brand" size={13} strokeWidth={2.5} />
      </span>
      <span className="flex-1 text-base font-semibold text-ink">Straydar</span>
      {!demo && (
        <Link to={DEMO_BASE} className="text-xs font-medium text-brand">
          Try the demo
        </Link>
      )}
    </header>
  )
}
