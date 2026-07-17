import { PawPrint } from 'lucide-react'

export function MobileHeader() {
  return (
    <header className="sticky top-0 z-20 flex items-center gap-2 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur md:hidden">
      <PawPrint className="text-emerald-600" size={22} />
      <span className="text-base font-semibold text-slate-900">Straydar</span>
    </header>
  )
}
