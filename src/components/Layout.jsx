import { Outlet } from 'react-router-dom'
import { DesktopSidebar, MobileTabBar } from './Sidebar'
import { MobileHeader } from './MobileHeader'

export function Layout() {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50">
      <DesktopSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileHeader />
        <main className="min-h-0 flex-1 overflow-y-auto pb-16 md:pb-0">
          <Outlet />
        </main>
        <MobileTabBar />
      </div>
    </div>
  )
}
