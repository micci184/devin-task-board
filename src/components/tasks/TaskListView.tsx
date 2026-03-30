'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, Filter } from 'lucide-react'
import { format } from 'date-fns'
import { useTranslations } from 'next-intl'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'

import type { Priority, TaskStatus } from '@prisma/client'

interface TaskCategory {
  category: {
    id: string
    name: string
    color: string
  }
}

interface TaskItem {
  id: string
  taskNumber: number
  title: string
  status: TaskStatus
  priority: Priority
  dueDate: string | null
  assignee: {
    id: string
    name: string
    avatarUrl: string | null
  } | null
  taskCategories: TaskCategory[]
}

interface Pagination {
  page: number
  perPage: number
  total: number
  totalPages: number
}

interface CategoryItem {
  id: string
  name: string
  color: string
}

interface TaskListViewProps {
  projectId: string
  projectKey: string
}

type SortByField = 'taskNumber' | 'title' | 'status' | 'priority' | 'dueDate' | 'createdAt'
type SortOrder = 'asc' | 'desc'

const statusClassNames: Record<TaskStatus, string> = {
  BACKLOG: 'bg-foreground/10 text-foreground/60',
  TODO: 'bg-primary/10 text-primary',
  IN_PROGRESS: 'bg-warning/10 text-warning',
  IN_REVIEW: 'bg-primary/10 text-primary',
  DONE: 'bg-success/10 text-success',
}

const priorityClassNames: Record<Priority, string> = {
  URGENT: 'bg-danger/10 text-danger',
  HIGH: 'bg-warning/10 text-warning',
  MEDIUM: 'bg-primary/10 text-primary',
  LOW: 'bg-foreground/10 text-foreground/60',
  NONE: 'bg-foreground/5 text-foreground/40',
}

const TableSkeleton = () => (
  <Table>
    <TableHeader>
      <TableRow>
        {Array.from({ length: 7 }).map((_, i) => (
          <TableHead key={i}>
            <Skeleton className="h-4 w-16" />
          </TableHead>
        ))}
      </TableRow>
    </TableHeader>
    <TableBody>
      {Array.from({ length: 10 }).map((_, i) => (
        <TableRow key={i}>
          <TableCell><Skeleton className="h-4 w-12" /></TableCell>
          <TableCell><Skeleton className="h-4 w-48" /></TableCell>
          <TableCell><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
          <TableCell><Skeleton className="h-5 w-12 rounded-full" /></TableCell>
          <TableCell><Skeleton className="h-6 w-6 rounded-full" /></TableCell>
          <TableCell><Skeleton className="h-4 w-16" /></TableCell>
          <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
)

export const TaskListView = ({ projectId, projectKey }: TaskListViewProps) => {
  const router = useRouter()
  const t = useTranslations('tasks')
  const tStatus = useTranslations('status')
  const tPriority = useTranslations('priority')
  const tCommon = useTranslations('common')
  const [tasks, setTasks] = useState<TaskItem[]>([])
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    perPage: 20,
    total: 0,
    totalPages: 0,
  })
  const [sortBy, setSortBy] = useState<SortByField>('taskNumber')
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc')
  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState<CategoryItem[]>([])
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([])
  const [showCategoryFilter, setShowCategoryFilter] = useState(false)

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch(`/api/projects/${projectId}/categories`)
        if (res.ok) {
          const json = await res.json()
          setCategories(json.data)
        }
      } catch {
        // ignore
      }
    }
    fetchCategories()
  }, [projectId])

  const fetchTasks = async (page: number, sort: SortByField, order: SortOrder, catIds: string[] = []) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(page),
        perPage: '20',
        sortBy: sort,
        sortOrder: order,
      })
      if (catIds.length > 0) {
        params.set('categoryIds', catIds.join(','))
      }
      const res = await fetch(`/api/projects/${projectId}/tasks?${params}`)
      if (!res.ok) throw new Error(t('fetchError'))
      const json = await res.json()
      setTasks(json.data)
      setPagination(json.pagination)
    } catch {
      setTasks([])
      setPagination({ page: 1, perPage: 20, total: 0, totalPages: 0 })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTasks(pagination.page, sortBy, sortOrder, selectedCategoryIds)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSort = (field: SortByField) => {
    const newOrder = sortBy === field && sortOrder === 'asc' ? 'desc' : 'asc'
    setSortBy(field)
    setSortOrder(newOrder)
    fetchTasks(1, field, newOrder, selectedCategoryIds)
  }

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > pagination.totalPages) return
    fetchTasks(newPage, sortBy, sortOrder, selectedCategoryIds)
  }

  const toggleCategoryFilter = (categoryId: string) => {
    const newIds = selectedCategoryIds.includes(categoryId)
      ? selectedCategoryIds.filter((id) => id !== categoryId)
      : [...selectedCategoryIds, categoryId]
    setSelectedCategoryIds(newIds)
    fetchTasks(1, sortBy, sortOrder, newIds)
  }

  const clearCategoryFilter = () => {
    setSelectedCategoryIds([])
    fetchTasks(1, sortBy, sortOrder, [])
  }

  const handleRowClick = (taskId: string) => {
    router.push(`/projects/${projectId}/tasks/${taskId}`)
  }

  const SortIcon = ({ field }: { field: SortByField }) => {
    if (sortBy !== field) return <ArrowUpDown size={14} className="text-foreground/30" />
    return sortOrder === 'asc'
      ? <ArrowUp size={14} className="text-primary" />
      : <ArrowDown size={14} className="text-primary" />
  }

  if (loading && tasks.length === 0) {
    return <TableSkeleton />
  }

  return (
    <div>
      {categories.length > 0 && (
        <div className="mb-4 flex items-center gap-2">
          <button
            onClick={() => setShowCategoryFilter(!showCategoryFilter)}
            className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
              selectedCategoryIds.length > 0
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-foreground/20 text-foreground/60 hover:bg-foreground/5'
            }`}
          >
            <Filter size={14} />
            {t('categoryLabel')}
            {selectedCategoryIds.length > 0 && (
              <span className="rounded-full bg-primary px-1.5 text-xs text-primary-foreground">
                {selectedCategoryIds.length}
              </span>
            )}
          </button>
          {showCategoryFilter && (
            <div className="flex flex-wrap gap-1.5">
              {categories.map((cat) => {
                const isSelected = selectedCategoryIds.includes(cat.id)
                return (
                  <button
                    key={cat.id}
                    onClick={() => toggleCategoryFilter(cat.id)}
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition-opacity ${
                      isSelected ? 'opacity-100' : 'opacity-50 hover:opacity-75'
                    }`}
                    style={{
                      backgroundColor: `color-mix(in oklch, ${cat.color} 15%, transparent)`,
                      color: cat.color,
                    }}
                  >
                    {cat.name}
                  </button>
                )
              })}
              {selectedCategoryIds.length > 0 && (
                <button
                  onClick={clearCategoryFilter}
                  className="rounded-full px-2.5 py-0.5 text-xs font-medium text-foreground/50 hover:text-foreground/80"
                >
                  {tCommon('clear')}
                </button>
              )}
            </div>
          )}
        </div>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              <button
                onClick={() => handleSort('taskNumber')}
                className="inline-flex items-center gap-1 hover:text-foreground"
              >
                {t('numberColumn')}
                <SortIcon field="taskNumber" />
              </button>
            </TableHead>
            <TableHead>
              <button
                onClick={() => handleSort('title')}
                className="inline-flex items-center gap-1 hover:text-foreground"
              >
                {t('titleLabel')}
                <SortIcon field="title" />
              </button>
            </TableHead>
            <TableHead>
              <button
                onClick={() => handleSort('status')}
                className="inline-flex items-center gap-1 hover:text-foreground"
              >
                {t('statusLabel')}
                <SortIcon field="status" />
              </button>
            </TableHead>
            <TableHead>
              <button
                onClick={() => handleSort('priority')}
                className="inline-flex items-center gap-1 hover:text-foreground"
              >
                {t('priorityLabel')}
                <SortIcon field="priority" />
              </button>
            </TableHead>
            <TableHead>{tCommon('assignee')}</TableHead>
            <TableHead>
              <button
                onClick={() => handleSort('dueDate')}
                className="inline-flex items-center gap-1 hover:text-foreground"
              >
                {tCommon('dueDate')}
                <SortIcon field="dueDate" />
              </button>
            </TableHead>
            <TableHead>{t('categoryLabel')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="h-32 text-center text-foreground/40">
                {t('noTasks')}
              </TableCell>
            </TableRow>
          ) : (
            tasks.map((task) => {
              const statusClassName = statusClassNames[task.status]
              const priorityClassName = priorityClassNames[task.priority]
              const dueDate = task.dueDate ? new Date(task.dueDate) : null
              const isOverdue = dueDate && task.status !== 'DONE' ? dueDate < new Date() : false

              return (
                <TableRow
                  key={task.id}
                  className="cursor-pointer"
                  onClick={() => handleRowClick(task.id)}
                >
                  <TableCell className="text-xs text-foreground/50">
                    {projectKey}-{task.taskNumber}
                  </TableCell>
                  <TableCell className="max-w-[300px] truncate font-medium text-foreground">
                    {task.title}
                  </TableCell>
                  <TableCell>
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${statusClassName}`}>
                      {tStatus(task.status)}
                    </span>
                  </TableCell>
                  <TableCell>
                    {task.priority !== 'NONE' && (
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${priorityClassName}`}>
                        {tPriority(task.priority)}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {task.assignee ? (
                      <div className="flex items-center gap-2">
                        <div
                          className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-xs font-medium text-primary"
                          title={task.assignee.name}
                        >
                          {task.assignee.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm text-foreground">{task.assignee.name}</span>
                      </div>
                    ) : (
                      <span className="text-sm text-foreground/30">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {dueDate ? (
                      <span className={`text-sm ${isOverdue ? 'font-medium text-danger' : 'text-foreground'}`}>
                        {format(dueDate, 'yyyy/MM/dd')}
                      </span>
                    ) : (
                      <span className="text-sm text-foreground/30">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {task.taskCategories.map((tc) => (
                        <span
                          key={tc.category.id}
                          className="inline-block rounded-full px-2 py-0.5 text-xs font-medium"
                          style={{
                            backgroundColor: `color-mix(in oklch, ${tc.category.color} 15%, transparent)`,
                            color: tc.category.color,
                          }}
                        >
                          {tc.category.name}
                        </span>
                      ))}
                    </div>
                  </TableCell>
                </TableRow>
              )
            })
          )}
        </TableBody>
      </Table>

      {pagination.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between border-t border-foreground/10 px-2 pt-4">
          <p className="text-sm text-foreground/50">
            {t('paginationInfo', { total: pagination.total, from: (pagination.page - 1) * pagination.perPage + 1, to: Math.min(pagination.page * pagination.perPage, pagination.total) })}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-foreground/10 text-foreground/60 transition-colors hover:bg-foreground/5 disabled:pointer-events-none disabled:opacity-30"
              aria-label={t('previousPage')}
            >
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
              .filter((p) => {
                const current = pagination.page
                return p === 1 || p === pagination.totalPages || Math.abs(p - current) <= 2
              })
              .reduce<(number | 'ellipsis')[]>((acc, p, i, arr) => {
                if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push('ellipsis')
                acc.push(p)
                return acc
              }, [])
              .map((item, i) =>
                item === 'ellipsis' ? (
                  <span key={`e-${i}`} className="px-1 text-foreground/30">
                    ...
                  </span>
                ) : (
                  <button
                    key={item}
                    onClick={() => handlePageChange(item as number)}
                    className={`inline-flex h-8 w-8 items-center justify-center rounded-md text-sm transition-colors ${
                      pagination.page === item
                        ? 'bg-primary text-primary-foreground font-medium'
                        : 'border border-foreground/10 text-foreground/60 hover:bg-foreground/5'
                    }`}
                  >
                    {item}
                  </button>
                ),
              )}
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-foreground/10 text-foreground/60 transition-colors hover:bg-foreground/5 disabled:pointer-events-none disabled:opacity-30"
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
