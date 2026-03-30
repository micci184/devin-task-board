'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import {
  Bell,
  CheckCheck,
  UserPlus,
  MessageSquare,
  ArrowRightLeft,
  Clock,
  AtSign,
  Mail,
  MailOpen,
} from 'lucide-react'
import { toast } from 'sonner'
import { useTranslations, useLocale } from 'next-intl'

import { Skeleton } from '@/components/ui/skeleton'
import { NOTIFICATION_READ_CHANGED_EVENT } from '@/components/notifications/NotificationBell'

import type { NotificationType } from '@prisma/client'

interface Notification {
  id: string
  type: NotificationType
  title: string
  message: string
  isRead: boolean
  linkUrl: string | null
  createdAt: string
}

interface Pagination {
  page: number
  perPage: number
  total: number
  totalPages: number
}

interface NotificationListProps {
  initialNotifications: Notification[]
  initialPagination: Pagination
}

const notificationIcons: Record<NotificationType, typeof Bell> = {
  TASK_ASSIGNED: UserPlus,
  TASK_COMMENTED: MessageSquare,
  TASK_STATUS_CHANGED: ArrowRightLeft,
  TASK_DUE_SOON: Clock,
  MENTIONED: AtSign,
}

export const NotificationList = ({
  initialNotifications,
  initialPagination,
}: NotificationListProps) => {
  const router = useRouter()
  const t = useTranslations('notifications')
  const tCommon = useTranslations('common')
  const locale = useLocale()
  const [notifications, setNotifications] = useState(initialNotifications)
  const [pagination, setPagination] = useState(initialPagination)
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all')
  const [isLoading, setIsLoading] = useState(false)
  const [isMarkingAll, setIsMarkingAll] = useState(false)

  const fetchNotifications = async (page: number, isReadFilter: 'all' | 'unread' | 'read') => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), perPage: '20' })
      if (isReadFilter === 'unread') params.set('isRead', 'false')
      if (isReadFilter === 'read') params.set('isRead', 'true')

      const res = await fetch(`/api/notifications?${params.toString()}`)
      if (!res.ok) {
        toast.error(t('fetchError'))
        return
      }

      const json = await res.json() as { data: Notification[]; pagination: Pagination }
      setNotifications(json.data)
      setPagination(json.pagination)
    } catch {
      toast.error(tCommon('networkError'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleFilterChange = (newFilter: 'all' | 'unread' | 'read') => {
    setFilter(newFilter)
    fetchNotifications(1, newFilter)
  }

  const dispatchReadChanged = () => {
    window.dispatchEvent(new Event(NOTIFICATION_READ_CHANGED_EVENT))
  }

  const handleToggleRead = async (id: string, isRead: boolean) => {
    try {
      const res = await fetch(`/api/notifications/${id}/read`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isRead }),
      })
      if (!res.ok) {
        toast.error(t('readUpdateError'))
        return
      }

      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead } : n)),
      )
      dispatchReadChanged()
    } catch {
      toast.error(tCommon('networkError'))
    }
  }

  const handleMarkAllAsRead = async () => {
    setIsMarkingAll(true)
    try {
      const res = await fetch('/api/notifications/read-all', { method: 'PATCH' })
      if (!res.ok) {
        toast.error(t('markAllError'))
        return
      }

      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
      dispatchReadChanged()
      toast.success(t('markAllSuccess'))
    } catch {
      toast.error(tCommon('networkError'))
    } finally {
      setIsMarkingAll(false)
    }
  }

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      await handleToggleRead(notification.id, true)
    }
    if (notification.linkUrl) {
      router.push(notification.linkUrl)
    }
  }

  const handlePageChange = (page: number) => {
    fetchNotifications(page, filter)
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {(['all', 'unread', 'read'] as const).map((f) => (
            <button
              key={f}
              onClick={() => handleFilterChange(f)}
              className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                filter === f
                  ? 'bg-primary text-primary-foreground'
                  : 'text-foreground/60 hover:bg-foreground/5 hover:text-foreground'
              }`}
            >
              {f === 'all' ? t('all') : f === 'unread' ? t('unread') : t('read')}
            </button>
          ))}
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            disabled={isMarkingAll}
            className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-foreground/60 transition-colors hover:bg-foreground/5 hover:text-foreground disabled:opacity-50"
          >
            <CheckCheck size={14} />
            <span>{isMarkingAll ? t('processing') : t('markAllRead')}</span>
          </button>
        )}
      </div>

      {isLoading ? (
        <NotificationListSkeleton />
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-foreground/10 py-12">
          <Bell size={32} className="text-foreground/30" />
          <p className="text-sm text-foreground/60">
            {filter === 'unread' ? t('noUnread') : filter === 'read' ? t('noRead') : t('noNotifications')}
          </p>
        </div>
      ) : (
        <div className="divide-y divide-foreground/10 rounded-lg border border-foreground/10">
          {notifications.map((notification) => {
            const Icon = notificationIcons[notification.type]
            return (
              <div
                key={notification.id}
                className={`flex w-full items-start gap-3 px-4 py-3 transition-colors ${
                  !notification.isRead ? 'bg-primary/5' : ''
                }`}
              >
                <button
                  onClick={() => handleNotificationClick(notification)}
                  className="flex min-w-0 flex-1 items-start gap-3 text-left hover:opacity-80"
                >
                  <div
                    className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                      !notification.isRead
                        ? 'bg-primary/10 text-primary'
                        : 'bg-foreground/5 text-foreground/40'
                    }`}
                  >
                    <Icon size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p
                        className={`truncate text-sm ${
                          !notification.isRead ? 'font-medium text-foreground' : 'text-foreground/80'
                        }`}
                      >
                        {notification.title}
                      </p>
                      {!notification.isRead && (
                        <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />
                      )}
                    </div>
                    <p className="mt-0.5 truncate text-xs text-foreground/60">
                      {notification.message}
                    </p>
                    <p className="mt-1 text-xs text-foreground/40">
                      {format(new Date(notification.createdAt), locale === 'ja' ? 'yyyy年M月d日 HH:mm' : 'MMM d, yyyy HH:mm', { locale: locale === 'ja' ? ja : undefined })}
                    </p>
                  </div>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleToggleRead(notification.id, !notification.isRead)
                  }}
                  className="mt-1 flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-xs text-foreground/50 transition-colors hover:bg-foreground/5 hover:text-foreground"
                  title={notification.isRead ? t('markAsUnread') : t('markAsRead')}
                >
                  {notification.isRead ? <Mail size={14} /> : <MailOpen size={14} />}
                  <span className="hidden sm:inline">
                    {notification.isRead ? t('markAsUnread') : t('markAsRead')}
                  </span>
                </button>
              </div>
            )
          })}
        </div>
      )}

      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page <= 1}
            className="rounded-md px-3 py-1.5 text-sm text-foreground/60 transition-colors hover:bg-foreground/5 hover:text-foreground disabled:opacity-50"
          >
            {tCommon('previous')}
          </button>
          <span className="text-sm text-foreground/60">
            {pagination.page} / {pagination.totalPages}
          </span>
          <button
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page >= pagination.totalPages}
            className="rounded-md px-3 py-1.5 text-sm text-foreground/60 transition-colors hover:bg-foreground/5 hover:text-foreground disabled:opacity-50"
          >
            {tCommon('next')}
          </button>
        </div>
      )}
    </div>
  )
}

export const NotificationListSkeleton = () => (
  <div className="divide-y divide-foreground/10 rounded-lg border border-foreground/10">
    {Array.from({ length: 5 }).map((_, i) => (
      <div key={i} className="flex items-start gap-3 px-4 py-3">
        <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-3 w-64" />
          <Skeleton className="h-3 w-32" />
        </div>
      </div>
    ))}
  </div>
)
