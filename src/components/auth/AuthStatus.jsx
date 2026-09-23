import { useState } from 'react'
import { Bell, LogOut } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useNotifications } from '../../context/NotificationsContext'
import { useData } from '../../context/DataContext'

function NotificationsBell() {
  const { notifications, dismiss, dismissAll } = useNotifications()
  const { getCatById } = useData()
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="relative flex h-8 w-8 items-center justify-center rounded-full text-muted hover:bg-card-soft hover:text-ink"
        aria-label="Notifications"
      >
        <Bell size={17} />
        {notifications.length > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-status-lost px-1 text-[10px] font-semibold text-white">
            {notifications.length}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 z-[1200] mt-2 w-64 rounded-xl border border-line bg-card p-2 shadow-lg">
          {notifications.length === 0 ? (
            <p className="p-2 text-xs text-muted">No new sightings for cats you follow.</p>
          ) : (
            <>
              {notifications.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => dismiss(n.id)}
                  className="block w-full rounded-lg px-2 py-1.5 text-left text-xs text-ink hover:bg-card-soft"
                >
                  <span className="font-medium">{getCatById(n.catId)?.name ?? 'A cat you follow'}</span>{' '}
                  was just sighted — {new Date(n.sightingTime).toLocaleTimeString()}
                </button>
              ))}
              <button
                type="button"
                onClick={dismissAll}
                className="mt-1 w-full rounded-lg px-2 py-1.5 text-center text-xs font-medium text-muted hover:bg-card-soft"
              >
                Clear all
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}

export function AuthStatus() {
  const { user, loading, signOut, openAuthModal } = useAuth()

  if (loading) return null

  if (!user) {
    return (
      <button
        type="button"
        onClick={openAuthModal}
        className="text-xs font-medium text-brand hover:underline"
      >
        Sign in
      </button>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <NotificationsBell />
      <button
        type="button"
        onClick={signOut}
        className="flex items-center gap-1 text-xs font-medium text-muted hover:text-ink"
        title={user.email}
      >
        <LogOut size={14} />
      </button>
    </div>
  )
}
