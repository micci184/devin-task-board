'use client'

import { useState, useEffect, useCallback } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { ja } from 'date-fns/locale'
import { Activity, Loader2, ChevronLeft, ChevronRight } from 'lucide-react'

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

const ACTION_LABELS: Record<ActivityAction, string> = {
  CREATED: '作成',
  UPDATED: '更新',
  DELETED: '削除',
  STATUS_CHANGED: 'ステータス変更',
  ASSIGNED: 'アサイン',
  COMMENTED: 'コメント',
  ATTACHED: 'ファイル添付',
}

const ENTITY_LABELS: Record<string, string> = {
  task: 'タスク',
  comment: 'コメント',
  project: 'プロジェクト',
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
    const date = new Date(String(value))
    if (isNaN(date.getTime())) return String(value)
    return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`
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
        {taskKey ? `${taskKey} を作成しました` : `${ENTITY_LABELS[activity.entityType] ?? activity.entityType}を作成しました`}
      </span>
    )
  }

  if (action === 'DELETED') {
    const taskKey = oldValue?.taskKey as string | undefined
    return (
      <span className="text-foreground/60">
        {taskKey ? `${taskKey} を削除しました` : `${ENTITY_LABELS[activity.entityType] ?? activity.entityType}を削除しました`}
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

  return (
    <span className="text-foreground/60">
      {ENTITY_LABELS[activity.entityType] ?? activity.entityType}を{ACTION_LABELS[action]}しました
    </span>
  )
}

interface ProjectActivityFeedProps {
  projectId: string
}

export const ProjectActivityFeed = ({ projectId }: ProjectActivityFeedProps) => {
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
        throw new Error(json.error?.message ?? 'アクティビティの取得に失敗しました')
      }
      const json = await res.json()
      setActivities(json.data)
      setPagination(json.pagination)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'アクティビティの取得に失敗しました')
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
        <p className="text-sm text-foreground/40">アクティビティがありません</p>
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

      {pagination && pagination.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between border-t border-foreground/10 pt-4">
          <p className="text-xs text-foreground/40">
            {pagination.total} 件中 {(pagination.page - 1) * pagination.perPage + 1}–
            {Math.min(pagination.page * pagination.perPage, pagination.total)} 件を表示
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevPage}
              disabled={currentPage <= 1 || loading}
              className="flex h-8 w-8 items-center justify-center rounded-md border border-foreground/10 text-foreground/60 transition-colors hover:bg-foreground/5 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="前のページ"
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
              aria-label="次のページ"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
