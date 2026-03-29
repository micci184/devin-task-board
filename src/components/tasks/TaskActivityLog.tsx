'use client'

import { useState, useEffect } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { ja } from 'date-fns/locale'
import { Activity, Loader2 } from 'lucide-react'

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

const ACTION_LABELS: Record<ActivityAction, string> = {
  CREATED: '作成',
  UPDATED: '更新',
  DELETED: '削除',
  STATUS_CHANGED: 'ステータス変更',
  ASSIGNED: 'アサイン',
  COMMENTED: 'コメント',
  ATTACHED: 'ファイル添付',
}

const STATUS_LABELS: Record<string, string> = {
  BACKLOG: 'Backlog',
  TODO: 'Todo',
  IN_PROGRESS: 'In Progress',
  IN_REVIEW: 'In Review',
  DONE: 'Done',
}

const PRIORITY_LABELS: Record<string, string> = {
  URGENT: '緊急',
  HIGH: '高',
  MEDIUM: '中',
  LOW: '低',
  NONE: 'なし',
}

const FIELD_LABELS: Record<string, string> = {
  title: 'タイトル',
  description: '説明',
  status: 'ステータス',
  priority: '優先度',
  assigneeId: '担当者',
  dueDate: '期限',
  estimatedHours: '見積もり工数',
  actualHours: '実績工数',
}

const formatFieldValue = (field: string, value: unknown): string => {
  if (value === null || value === undefined) return '未設定'

  if (field === 'status') return STATUS_LABELS[String(value)] ?? String(value)
  if (field === 'priority') return PRIORITY_LABELS[String(value)] ?? String(value)
  if (field === 'dueDate') {
    try {
      const date = new Date(String(value))
      return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`
    } catch {
      return String(value)
    }
  }
  if (field === 'estimatedHours' || field === 'actualHours') {
    return `${value}h`
  }
  if (field === 'assigneeId') return String(value) || '未割り当て'
  if (field === 'description') {
    const str = String(value)
    return str.length > 50 ? `${str.substring(0, 50)}...` : str
  }
  return String(value)
}

const ActivityDetail = ({ activity }: { activity: ActivityItem }) => {
  const { action, oldValue, newValue } = activity

  if (action === 'CREATED') {
    const taskKey = newValue?.taskKey as string | undefined
    return (
      <span className="text-foreground/60">
        {taskKey ? `${taskKey} を作成しました` : 'タスクを作成しました'}
      </span>
    )
  }

  if (action === 'DELETED') {
    const taskKey = oldValue?.taskKey as string | undefined
    return (
      <span className="text-foreground/60">
        {taskKey ? `${taskKey} を削除しました` : 'タスクを削除しました'}
      </span>
    )
  }

  if (action === 'STATUS_CHANGED') {
    const oldStatus = oldValue?.status as string | undefined
    const newStatus = newValue?.status as string | undefined
    return (
      <span className="text-foreground/60">
        ステータスを変更:{' '}
        <span className="font-medium text-foreground">{STATUS_LABELS[oldStatus ?? ''] ?? oldStatus}</span>
        {' → '}
        <span className="font-medium text-foreground">{STATUS_LABELS[newStatus ?? ''] ?? newStatus}</span>
      </span>
    )
  }

  if (action === 'ASSIGNED') {
    const newAssigneeId = newValue?.assigneeId as string | null | undefined
    return (
      <span className="text-foreground/60">
        {newAssigneeId ? '担当者を変更しました' : '担当者を解除しました'}
      </span>
    )
  }

  if (action === 'COMMENTED') {
    const content = newValue?.content as string | undefined
    return (
      <span className="text-foreground/60">
        コメントを投稿しました
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
        ファイルを添付しました
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
      return <span className="text-foreground/60">タスクを更新しました</span>
    }

    return (
      <div className="space-y-1">
        {changes.map(({ field, oldVal, newVal }) => (
          <div key={field} className="text-foreground/60">
            <span className="font-medium text-foreground/80">{FIELD_LABELS[field] ?? field}</span>
            を変更:{' '}
            <span className="font-medium text-foreground">{formatFieldValue(field, oldVal)}</span>
            {' → '}
            <span className="font-medium text-foreground">{formatFieldValue(field, newVal)}</span>
          </div>
        ))}
      </div>
    )
  }

  return <span className="text-foreground/60">タスクを{ACTION_LABELS[action]}しました</span>
}

interface TaskActivityLogProps {
  taskId: string
}

export const TaskActivityLog = ({ taskId }: TaskActivityLogProps) => {
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const res = await fetch(`/api/tasks/${taskId}/activities`)
        if (!res.ok) {
          const json = await res.json()
          throw new Error(json.error?.message ?? 'アクティビティの取得に失敗しました')
        }
        const json = await res.json()
        setActivities(json.data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'アクティビティの取得に失敗しました')
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
      <p className="py-4 text-sm text-foreground/40">アクティビティがありません</p>
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
                locale: ja,
              })}
            </p>
          </div>
        </li>
      ))}
    </ul>
  )
}
