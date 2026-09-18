import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from '../services/supabaseClient'
import { fetchFollowedCatIds, insertFollow, deleteFollow } from '../services/db'
import { useAuth } from './AuthContext'

const NotificationsContext = createContext(null)

// In-app only: notifications live in memory for the session, driven by the
// same Supabase Realtime feed DataContext already subscribes to. No
// separate notifications table — a followed cat's next sighting insert is
// the notification.
export function NotificationsProvider({ children }) {
  const { user } = useAuth()
  const [followedCatIds, setFollowedCatIds] = useState(new Set())
  const [notifications, setNotifications] = useState([])

  useEffect(() => {
    if (!user) {
      setFollowedCatIds(new Set())
      setNotifications([])
      return
    }
    let cancelled = false
    fetchFollowedCatIds(user.id).then((ids) => {
      if (!cancelled) setFollowedCatIds(new Set(ids))
    })
    return () => {
      cancelled = true
    }
  }, [user])

  useEffect(() => {
    if (!user || followedCatIds.size === 0) return

    const channel = supabase
      .channel(`follow-notifications:${user.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'sightings' }, (payload) => {
        const sighting = payload.new
        if (!followedCatIds.has(sighting.cat_id) || sighting.reporter_id === user.id) return
        setNotifications((prev) => [
          { id: sighting.id, catId: sighting.cat_id, sightingTime: sighting.sighting_time },
          ...prev,
        ])
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [user, followedCatIds])

  const follow = async (catId) => {
    await insertFollow(user.id, catId)
    setFollowedCatIds((prev) => new Set(prev).add(catId))
  }

  const unfollow = async (catId) => {
    await deleteFollow(user.id, catId)
    setFollowedCatIds((prev) => {
      const next = new Set(prev)
      next.delete(catId)
      return next
    })
  }

  const dismiss = (id) => setNotifications((prev) => prev.filter((n) => n.id !== id))
  const dismissAll = () => setNotifications([])

  const value = useMemo(
    () => ({ followedCatIds, notifications, follow, unfollow, dismiss, dismissAll }),
    [followedCatIds, notifications],
  )

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext)
  if (!ctx) throw new Error('useNotifications must be used within a NotificationsProvider')
  return ctx
}
