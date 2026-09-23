import { Outlet } from 'react-router-dom'
import { DesktopSidebar, MobileTabBar } from './Sidebar'
import { MobileHeader } from './MobileHeader'
import { useDemoMode } from '../hooks/useDemoMode'

export function Layout() {
  const demo = useDemoMode()
  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-paper">
      {demo && (
        <div className="shrink-0 bg-brand px-3 py-1.5 text-center text-xs font-medium text-white">
          Demo mode — sample neighborhood, nothing here is saved
        </div>
      )}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <DesktopSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <MobileHeader />
          <main className="min-h-0 flex-1 overflow-y-auto pb-16 md:pb-0">
            <Outlet />
          </main>
          <MobileTabBar />
        </div>
      </div>
    </div>
  )
}
