'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

import { Bell } from 'lucide-react'

export const NotificationBell = () => {
  const [unreadCount, setUnreadCount] = useState(0)

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
    return () => clearInterval(interval)
  }, [])

  return (
    <Link
      href="/notifications"
      className="relative flex h-8 w-8 items-center justify-center rounded-md text-foreground/60 hover:bg-foreground/5 hover:text-foreground"
      aria-label="通知"
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
