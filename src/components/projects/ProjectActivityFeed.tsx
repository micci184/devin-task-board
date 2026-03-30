'use client'

import { useState, useEffect, useCallback } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { ja } from 'date-fns/locale'
import { Activity, Loader2, ChevronLeft, ChevronRight } from 'lucide-react'
import { useTranslations, useLocale } from 'next-intl'

import type { ActivityAction } from '@prisma/client'

interface ActivityUser {
  id: string
  name: string
  avatarUrl: string | null
}

interface ActivityItem {
  id: string
  action: ActivityAction
  entityType: string
  entityId: string
  userId: string
  projectId: string
  oldValue: Record<string, unknown> | null
  newValue: Record<string, unknown> | null
  createdAt: string
  user: ActivityUser
}

interface Pagination {
  page: number
  perPage: number
  total: number
  totalPages: number
}


const ActivityDetail = ({ activity, t, tStatus, tPriority }: { activity: ActivityItem; t: ReturnType<typeof useTranslations<'activity'>>; tStatus: ReturnType<typeof useTranslations<'dashboardStatus'>>; tPriority: ReturnType<typeof useTranslations<'tasks'>> }) => {
  const { action, oldValue, newValue } = activity

  const FIELD_LABELS: Record<string, string> = {
    title: t('field.title'),
    description: t('field.description'),
    status: t('field.status'),
    priority: t('field.priority'),
    assigneeId: t('field.assignee'),
    dueDate: t('field.dueDate'),
    estimatedHours: t('field.estimatedHours'),
    actualHours: t('field.actualHours'),
  }

  const getStatusLabel = (status: string) => {
    try {
      return tStatus(status as 'BACKLOG' | 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE')
    } catch {
      return status
    }
  }

  const getPriorityLabel = (priority: string) => {
    try {
      return tPriority(`priority.${priority}` as 'priority.URGENT' | 'priority.HIGH' | 'priority.MEDIUM' | 'priority.LOW' | 'priority.NONE')
    } catch {
      return priority
    }
  }

  const getEntityLabel = (entityType: string) => {
    try {
      return t(`entity.${entityType}` as 'entity.task' | 'entity.comment' | 'entity.project')
    } catch {
      return entityType
    }
  }

  const formatFieldValue = (field: string, value: unknown): string => {
    if (value === null || value === undefined) return t('unset')
    if (field === 'status') return getStatusLabel(String(value))
    if (field === 'priority') return getPriorityLabel(String(value))
    if (field === 'dueDate') {
      const date = new Date(String(value))
      if (isNaN(date.getTime())) return String(value)
      return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`
    }
    if (field === 'estimatedHours' || field === 'actualHours') return `${value}h`
    if (field === 'assigneeId') return String(value) || t('unassigned')
    if (field === 'description') {
      const str = String(value)
      return str.length > 50 ? `${str.substring(0, 50)}...` : str
    }
    return String(value)
  }

  if (action === 'CREATED') {
    const taskKey = newValue?.taskKey as string | undefined
    return (
      <span className="text-foreground/60">
        {taskKey ? t('detail.createdWithKey', { key: taskKey }) : t('detail.created', { entity: getEntityLabel(activity.entityType) })}
      </span>
    )
  }

  if (action === 'DELETED') {
    const taskKey = oldValue?.taskKey as string | undefined
    return (
      <span className="text-foreground/60">
        {taskKey ? t('detail.deletedWithKey', { key: taskKey }) : t('detail.deleted', { entity: getEntityLabel(activity.entityType) })}
      </span>
    )
  }

  if (action === 'STATUS_CHANGED') {
    const oldStatus = oldValue?.status as string | undefined
    const newStatus = newValue?.status as string | undefined
    return (
      <span className="text-foreground/60">
        {t('detail.statusChanged')}{' '}
        <span className="font-medium text-foreground">{getStatusLabel(oldStatus ?? '')}</span>
        {' → '}
        <span className="font-medium text-foreground">{getStatusLabel(newStatus ?? '')}</span>
      </span>
    )
  }

  if (action === 'ASSIGNED') {
    const newAssigneeId = newValue?.assigneeId as string | null | undefined
    return (
      <span className="text-foreground/60">
        {newAssigneeId ? t('detail.assigneeChanged') : t('detail.assigneeRemoved')}
      </span>
    )
  }

  if (action === 'COMMENTED') {
    const content = newValue?.content as string | undefined
    return (
      <span className="text-foreground/60">
        {t('detail.commented')}
        {content && (
          <span className="ml-1 text-foreground/40">
            — {content.length > 80 ? `${content.substring(0, 80)}...` : content}
          </span>
        )}
      </span>
    )
  }

  if (action === 'ATTACHED') {
    const fileName = newValue?.fileName as string | undefined
    return (
      <span className="text-foreground/60">
        {t('detail.attached')}
        {fileName && <span className="ml-1 font-medium text-foreground">{fileName}</span>}
      </span>
    )
  }

  if (action === 'UPDATED' && oldValue && newValue) {
    const changes: Array<{ field: string; oldVal: unknown; newVal: unknown }> = []
    const newObj = newValue as Record<string, unknown>
    const oldObj = oldValue as Record<string, unknown>

    for (const key of Object.keys(newObj)) {
      changes.push({ field: key, oldVal: oldObj[key], newVal: newObj[key] })
    }

    if (changes.length === 0) {
      return <span className="text-foreground/60">{t('detail.updated')}</span>
    }

    return (
      <div className="space-y-1">
        {changes.map(({ field, oldVal, newVal }) => (
          <div key={field} className="text-foreground/60">
            <span className="font-medium text-foreground/80">{FIELD_LABELS[field] ?? field}</span>
            {t('detail.fieldChanged')}{' '}
            <span className="font-medium text-foreground">{formatFieldValue(field, oldVal)}</span>
            {' → '}
            <span className="font-medium text-foreground">{formatFieldValue(field, newVal)}</span>
          </div>
        ))}
      </div>
    )
  }

  const actionLabel = t(`action.${action}` as 'action.CREATED' | 'action.UPDATED' | 'action.DELETED' | 'action.STATUS_CHANGED' | 'action.ASSIGNED' | 'action.COMMENTED' | 'action.ATTACHED')
  return (
    <span className="text-foreground/60">
      {t('activityMessage', { entity: getEntityLabel(activity.entityType), action: actionLabel })}
    </span>
  )
}

interface ProjectActivityFeedProps {
  projectId: string
}

export const ProjectActivityFeed = ({ projectId }: ProjectActivityFeedProps) => {
  const t = useTranslations('activity')
  const tStatus = useTranslations('dashboardStatus')
  const tPriority = useTranslations('tasks')
  const locale = useLocale()
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)

  const fetchActivities = useCallback(async (page: number) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/projects/${projectId}/activities?page=${page}&perPage=20`)
      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error?.message ?? t('fetchError'))
      }
      const json = await res.json()
      setActivities(json.data)
      setPagination(json.pagination)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('fetchError'))
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    fetchActivities(currentPage)
  }, [currentPage, fetchActivities])

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1)
  }

  const handleNextPage = () => {
    if (pagination && currentPage < pagination.totalPages) setCurrentPage(currentPage + 1)
  }

  if (loading && activities.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={24} className="animate-spin text-foreground/40" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg border border-danger/20 bg-danger/5 p-4">
        <p className="text-sm text-danger">{error}</p>
      </div>
    )
  }

  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Activity size={48} className="mb-3 text-foreground/20" />
        <p className="text-sm text-foreground/40">{t('noActivity')}</p>
      </div>
    )
  }

  return (
    <div>
      <ul className="space-y-0">
        {activities.map((activity, index) => (
          <li
            key={activity.id}
            className="relative flex gap-3 pb-4 last:pb-0"
          >
            {index < activities.length - 1 && (
              <div className="absolute left-4 top-8 h-[calc(100%-8px)] w-px bg-foreground/10" />
            )}

            <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
              {activity.user.name.slice(0, 1).toUpperCase()}
            </div>

            <div className="min-w-0 flex-1 pt-0.5">
              <div className="text-sm">
                <span className="font-medium text-foreground">{activity.user.name}</span>
              </div>
              <div className="mt-0.5 text-sm">
                <ActivityDetail activity={activity} t={t} tStatus={tStatus} tPriority={tPriority} />
              </div>
              <p className="mt-1 text-xs text-foreground/40">
                {formatDistanceToNow(new Date(activity.createdAt), {
                  addSuffix: true,
                  locale: locale === 'ja' ? ja : undefined,
                })}
              </p>
            </div>
          </li>
        ))}
      </ul>

      {pagination && pagination.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between border-t border-foreground/10 pt-4">
          <p className="text-xs text-foreground/40">
            {t('paginationInfo', { total: pagination.total, start: (pagination.page - 1) * pagination.perPage + 1, end: Math.min(pagination.page * pagination.perPage, pagination.total) })}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevPage}
              disabled={currentPage <= 1 || loading}
              className="flex h-8 w-8 items-center justify-center rounded-md border border-foreground/10 text-foreground/60 transition-colors hover:bg-foreground/5 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label={t('prevPage')}
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs text-foreground/60">
              {pagination.page} / {pagination.totalPages}
            </span>
            <button
              onClick={handleNextPage}
              disabled={!pagination || currentPage >= pagination.totalPages || loading}
              className="flex h-8 w-8 items-center justify-center rounded-md border border-foreground/10 text-foreground/60 transition-colors hover:bg-foreground/5 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label={t('nextPage')}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
