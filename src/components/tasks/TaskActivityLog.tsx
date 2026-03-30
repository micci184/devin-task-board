'use client'

import { useState, useEffect } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { ja, enUS } from 'date-fns/locale'
import { Activity, Loader2 } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'

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

const FIELD_KEYS: Record<string, string> = {
  title: 'titleLabel',
  description: 'descriptionLabel',
  status: 'statusLabel',
  priority: 'priorityLabel',
  assigneeId: 'assigneeLabel',
  dueDate: 'dueDateLabel',
  estimatedHours: 'estimatedHours',
  actualHours: 'actualHours',
}

const ActivityDetail = ({ activity }: { activity: ActivityItem }) => {
  const { action, oldValue, newValue } = activity
  const t = useTranslations('activity')
  const tTasks = useTranslations('tasks')
  const tStatus = useTranslations('status')
  const tPriority = useTranslations('priority')
  const tCommon = useTranslations('common')

  const formatFieldValue = (field: string, value: unknown): string => {
    if (value === null || value === undefined) return tCommon('unset')
    if (field === 'status') return tStatus(String(value) as 'BACKLOG' | 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE')
    if (field === 'priority') return tPriority(String(value) as 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE')
    if (field === 'dueDate') {
      const date = new Date(String(value))
      if (isNaN(date.getTime())) return String(value)
      return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`
    }
    if (field === 'estimatedHours' || field === 'actualHours') {
      return `${value}h`
    }
    if (field === 'assigneeId') return String(value) || tCommon('unassigned')
    if (field === 'description') {
      const str = String(value)
      return str.length > 50 ? `${str.substring(0, 50)}...` : str
    }
    return String(value)
  }

  const getFieldLabel = (field: string): string => {
    const key = FIELD_KEYS[field]
    if (key) return tTasks(key)
    return field
  }

  if (action === 'CREATED') {
    const taskKey = newValue?.taskKey as string | undefined
    return (
      <span className="text-foreground/60">
        {taskKey ? t('createdWithKey', { key: taskKey }) : t('created')}
      </span>
    )
  }

  if (action === 'DELETED') {
    const taskKey = oldValue?.taskKey as string | undefined
    return (
      <span className="text-foreground/60">
        {taskKey ? t('deletedWithKey', { key: taskKey }) : t('deleted')}
      </span>
    )
  }

  if (action === 'STATUS_CHANGED') {
    const oldStatus = oldValue?.status as string | undefined
    const newStatusVal = newValue?.status as string | undefined
    return (
      <span className="text-foreground/60">
        {t('statusChanged')}{' '}
        <span className="font-medium text-foreground">{oldStatus ? tStatus(oldStatus as 'BACKLOG' | 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE') : oldStatus}</span>
        {' → '}
        <span className="font-medium text-foreground">{newStatusVal ? tStatus(newStatusVal as 'BACKLOG' | 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE') : newStatusVal}</span>
      </span>
    )
  }

  if (action === 'ASSIGNED') {
    const newAssigneeId = newValue?.assigneeId as string | null | undefined
    return (
      <span className="text-foreground/60">
        {newAssigneeId ? t('assigneeChanged') : t('assigneeRemoved')}
      </span>
    )
  }

  if (action === 'COMMENTED') {
    const content = newValue?.content as string | undefined
    return (
      <span className="text-foreground/60">
        {t('commented')}
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
        {t('attached')}
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
      return <span className="text-foreground/60">{t('updated')}</span>
    }

    return (
      <div className="space-y-1">
        {changes.map(({ field, oldVal, newVal }) => (
          <div key={field} className="text-foreground/60">
            <span className="font-medium text-foreground/80">{getFieldLabel(field)}</span>
            {t('fieldChanged')}{' '}
            <span className="font-medium text-foreground">{formatFieldValue(field, oldVal)}</span>
            {' → '}
            <span className="font-medium text-foreground">{formatFieldValue(field, newVal)}</span>
          </div>
        ))}
      </div>
    )
  }

  return <span className="text-foreground/60">{t('actionPerformed', { action: t(`actions.${action}`) })}</span>
}

interface TaskActivityLogProps {
  taskId: string
}

export const TaskActivityLog = ({ taskId }: TaskActivityLogProps) => {
  const t = useTranslations('activity')
  const locale = useLocale()
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const res = await fetch(`/api/tasks/${taskId}/activities`)
        if (!res.ok) {
          const json = await res.json()
          throw new Error(json.error?.message ?? t('fetchError'))
        }
        const json = await res.json()
        setActivities(json.data)
      } catch (err) {
        setError(err instanceof Error ? err.message : t('fetchError'))
      } finally {
        setLoading(false)
      }
    }

    fetchActivities()
  }, [taskId])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 size={20} className="animate-spin text-foreground/40" />
      </div>
    )
  }

  if (error) {
    return (
      <p className="py-4 text-sm text-danger">{error}</p>
    )
  }

  if (activities.length === 0) {
    return (
      <p className="py-4 text-sm text-foreground/40">{t('empty')}</p>
    )
  }

  return (
    <ul className="space-y-0">
      {activities.map((activity, index) => (
        <li
          key={activity.id}
          className="relative flex gap-3 pb-4 last:pb-0"
        >
          {/* Timeline line */}
          {index < activities.length - 1 && (
            <div className="absolute left-4 top-8 h-[calc(100%-8px)] w-px bg-foreground/10" />
          )}

          {/* Avatar */}
          <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
            {activity.user.name.slice(0, 1).toUpperCase()}
          </div>

          {/* Content */}
          <div className="min-w-0 flex-1 pt-0.5">
            <div className="text-sm">
              <span className="font-medium text-foreground">{activity.user.name}</span>
            </div>
            <div className="mt-0.5 text-sm">
              <ActivityDetail activity={activity} />
            </div>
            <p className="mt-1 text-xs text-foreground/40">
              {formatDistanceToNow(new Date(activity.createdAt), {
                addSuffix: true,
                locale: locale === 'ja' ? ja : enUS,
              })}
            </p>
          </div>
        </li>
      ))}
    </ul>
  )
}
