'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'

import { Bell } from 'lucide-react'

export const NOTIFICATION_READ_CHANGED_EVENT = 'notification-read-changed'

export const NotificationBell = () => {
  const [unreadCount, setUnreadCount] = useState(0)
  const t = useTranslations('nav')

  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const res = await fetch('/api/notifications?perPage=1&isRead=false')
        if (!res.ok) return
        const json = await res.json() as { pagination: { total: number } }
        setUnreadCount(json.pagination.total)
      } catch {
        // ignore
      }
    }

    fetchUnreadCount()

    const interval = setInterval(fetchUnreadCount, 30000)

    const handleReadChanged = () => {
      fetchUnreadCount()
    }
    window.addEventListener(NOTIFICATION_READ_CHANGED_EVENT, handleReadChanged)

    return () => {
      clearInterval(interval)
      window.removeEventListener(NOTIFICATION_READ_CHANGED_EVENT, handleReadChanged)
    }
  }, [])

  return (
    <Link
      href="/notifications"
      className="relative flex h-8 w-8 items-center justify-center rounded-md text-foreground/60 hover:bg-foreground/5 hover:text-foreground"
      aria-label={t('notifications')}
    >
      <Bell size={18} />
      {unreadCount > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold leading-none text-white">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </Link>
  )
}
