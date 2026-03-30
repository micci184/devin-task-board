'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

import {
  addDays,
  differenceInDays,
  eachDayOfInterval,
  eachMonthOfInterval,
  eachWeekOfInterval,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isWeekend,
  startOfWeek,
} from 'date-fns'
import { ja } from 'date-fns/locale'
import {
  AlertTriangle,
  Calendar,
  ChevronLeft,
  ChevronRight,
  GripVertical,
  Layers,
  User,
} from 'lucide-react'
import { toast } from 'sonner'

import type { Priority, TaskStatus } from '@prisma/client'

interface TaskCategory {
  category: {
    id: string
    name: string
    color: string
  }
}

interface GanttTask {
  id: string
  taskNumber: number
  title: string
  status: TaskStatus
  priority: Priority
  startDate: string | null
  dueDate: string | null
  assignee: {
    id: string
    name: string
    avatarUrl: string | null
  } | null
  taskCategories: TaskCategory[]
}

interface CategoryItem {
  id: string
  name: string
  color: string
}

interface GanttChartProps {
  tasks: GanttTask[]
  projectId: string
  projectKey: string
  categories: CategoryItem[]
  members: { id: string; name: string }[]
}

type ViewMode = 'day' | 'week' | 'month'
type GroupBy = 'none' | 'category' | 'assignee'

const TASK_ROW_HEIGHT = 40
const HEADER_HEIGHT = 56
const LEFT_PANEL_WIDTH = 280

const viewModeConfig = {
  day: { cellWidth: 40, label: '日' },
  week: { cellWidth: 120, label: '週' },
  month: { cellWidth: 180, label: '月' },
} as const

const priorityColors: Record<Priority, string> = {
  URGENT: 'var(--danger)',
  HIGH: 'var(--warning)',
  MEDIUM: 'var(--primary)',
  LOW: 'oklch(0.6 0.05 255)',
  NONE: 'oklch(0.5 0.02 255)',
}

interface TaskGroup {
  key: string
  label: string
  color?: string
  tasks: GanttTask[]
}

const groupTasks = (
  tasks: GanttTask[],
  groupBy: GroupBy,
): TaskGroup[] => {
  if (groupBy === 'none') {
    return [{ key: 'all', label: 'すべてのタスク', tasks }]
  }

  if (groupBy === 'category') {
    const grouped = new Map<string, { label: string; color: string; tasks: GanttTask[] }>()
    const uncategorized: GanttTask[] = []

    for (const task of tasks) {
      if (task.taskCategories.length === 0) {
        uncategorized.push(task)
      } else {
        for (const tc of task.taskCategories) {
          const existing = grouped.get(tc.category.id)
          if (existing) {
            existing.tasks.push(task)
          } else {
            grouped.set(tc.category.id, {
              label: tc.category.name,
              color: tc.category.color,
              tasks: [task],
            })
          }
        }
      }
    }

    const groups: TaskGroup[] = []
    for (const [key, value] of grouped) {
      groups.push({ key, label: value.label, color: value.color, tasks: value.tasks })
    }
    if (uncategorized.length > 0) {
      groups.push({ key: 'uncategorized', label: '未分類', tasks: uncategorized })
    }
    return groups
  }

  // groupBy === 'assignee'
  const grouped = new Map<string, { label: string; tasks: GanttTask[] }>()
  const unassigned: GanttTask[] = []

  for (const task of tasks) {
    if (!task.assignee) {
      unassigned.push(task)
    } else {
      const existing = grouped.get(task.assignee.id)
      if (existing) {
        existing.tasks.push(task)
      } else {
        grouped.set(task.assignee.id, {
          label: task.assignee.name,
          tasks: [task],
        })
      }
    }
  }

  const groups: TaskGroup[] = []
  for (const [key, value] of grouped) {
    groups.push({ key, label: value.label, tasks: value.tasks })
  }
  if (unassigned.length > 0) {
    groups.push({ key: 'unassigned', label: '未割当', tasks: unassigned })
  }
  return groups
}

export const GanttChart = ({
  tasks,
  projectKey,
  categories: _categories,
  members: _members,
}: GanttChartProps) => {
  const router = useRouter()
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const hasScrolledRef = useRef(false)

  const [viewMode, setViewMode] = useState<ViewMode>('day')
  const [groupBy, setGroupBy] = useState<GroupBy>('none')
  const [localTasks, setLocalTasks] = useState<GanttTask[]>(tasks)

  // Drag state
  const [dragTaskId, setDragTaskId] = useState<string | null>(null)
  const [dragType, setDragType] = useState<'move' | 'resize-start' | 'resize-end' | null>(null)
  const [dragStartX, setDragStartX] = useState(0)
  const [dragDeltaDays, setDragDeltaDays] = useState(0)
  const dragDeltaDaysRef = useRef(0)
  const localTasksRef = useRef(localTasks)
  const tasksRef = useRef(tasks)
  const dragTypeRef = useRef(dragType)
  const dragTaskIdRef = useRef(dragTaskId)
  const dragStartXRef = useRef(dragStartX)

  localTasksRef.current = localTasks
  tasksRef.current = tasks
  dragTypeRef.current = dragType
  dragTaskIdRef.current = dragTaskId
  dragStartXRef.current = dragStartX

  useEffect(() => {
    setLocalTasks(tasks)
  }, [tasks])

  const [today] = useState(() => new Date())

  // Calculate timeline range
  const computeTimelineRange = () => {
    const validTasks = localTasks.filter((t) => t.startDate || t.dueDate)
    if (validTasks.length === 0) {
      const s = addDays(today, -14)
      const e = addDays(today, 30)
      return { timelineStart: startOfWeek(s, { locale: ja }), timelineEnd: endOfWeek(e, { locale: ja }) }
    }

    let earliest = today
    let latest = today

    for (const task of validTasks) {
      const start = task.startDate ? new Date(task.startDate) : null
      const end = task.dueDate ? new Date(task.dueDate) : null
      if (start && start < earliest) earliest = start
      if (end && end > latest) latest = end
      if (start && start > latest) latest = start
      if (end && end < earliest) earliest = end
    }

    const s = addDays(startOfWeek(earliest, { locale: ja }), -7)
    const e = addDays(endOfWeek(latest, { locale: ja }), 14)
    return { timelineStart: s, timelineEnd: e }
  }
  const { timelineStart, timelineEnd } = computeTimelineRange()

  // Generate time cells based on view mode
  const computeTimeCells = () => {
    if (viewMode === 'day') {
      return eachDayOfInterval({ start: timelineStart, end: timelineEnd })
    }
    if (viewMode === 'week') {
      return eachWeekOfInterval({ start: timelineStart, end: timelineEnd }, { locale: ja })
    }
    return eachMonthOfInterval({ start: timelineStart, end: timelineEnd })
  }
  const timeCells = computeTimeCells()

  const totalTimelineWidth = timeCells.length * viewModeConfig[viewMode].cellWidth

  // Convert date to pixel position
  const dateToX = (date: Date): number => {
    const totalDays = differenceInDays(timelineEnd, timelineStart)
    if (totalDays === 0) return 0
    const dayOffset = differenceInDays(date, timelineStart)
    return (dayOffset / totalDays) * totalTimelineWidth
  }

  // Filter tasks with valid dates and those without
  const scheduledTasks: GanttTask[] = []
  const unscheduledTasks: GanttTask[] = []
  for (const task of localTasks) {
    if (task.startDate && task.dueDate) {
      scheduledTasks.push(task)
    } else {
      unscheduledTasks.push(task)
    }
  }

  const groups = groupTasks(scheduledTasks, groupBy)

  // Build flat row list for rendering
  const rows: Array<{ type: 'group'; group: TaskGroup } | { type: 'task'; task: GanttTask; groupKey: string }> = []
  for (const group of groups) {
    if (groupBy !== 'none') {
      rows.push({ type: 'group', group })
    }
    for (const task of group.tasks) {
      rows.push({ type: 'task', task, groupKey: group.key })
    }
  }

  // Scroll to today on mount only
  useEffect(() => {
    if (scrollContainerRef.current && !hasScrolledRef.current) {
      const todayX = dateToX(today)
      scrollContainerRef.current.scrollLeft = todayX - scrollContainerRef.current.clientWidth / 3
      hasScrolledRef.current = true
    }
  }, [dateToX, today])

  // Navigate timeline
  const navigate = (direction: 'prev' | 'next') => {
    if (!scrollContainerRef.current) return
    const { cellWidth } = viewModeConfig[viewMode]
    const shift = cellWidth * (viewMode === 'day' ? 7 : viewMode === 'week' ? 4 : 3)
    scrollContainerRef.current.scrollBy({
      left: direction === 'next' ? shift : -shift,
      behavior: 'smooth',
    })
  }

  const scrollToToday = () => {
    if (!scrollContainerRef.current) return
    const todayX = dateToX(today)
    scrollContainerRef.current.scrollTo({
      left: todayX - scrollContainerRef.current.clientWidth / 3,
      behavior: 'smooth',
    })
  }

  // Drag handlers
  const handleBarMouseDown = (
    e: React.MouseEvent,
    taskId: string,
    type: 'move' | 'resize-start' | 'resize-end',
  ) => {
    e.preventDefault()
    e.stopPropagation()
    setDragTaskId(taskId)
    setDragType(type)
    setDragStartX(e.clientX)
    dragDeltaDaysRef.current = 0
    setDragDeltaDays(0)
  }

  useEffect(() => {
    if (!dragTaskId || !dragType) return

    const currentTimelineStart = timelineStart
    const currentTimelineEnd = timelineEnd
    const currentTotalWidth = totalTimelineWidth

    const handleMouseMove = (e: MouseEvent) => {
      const totalDays = differenceInDays(currentTimelineEnd, currentTimelineStart)
      if (totalDays === 0) return
      const pxPerDay = currentTotalWidth / totalDays
      const deltaX = e.clientX - dragStartXRef.current
      const deltaDays = Math.round(deltaX / pxPerDay)
      dragDeltaDaysRef.current = deltaDays
      setDragDeltaDays(deltaDays)
    }

    const handleMouseUp = async () => {
      const currentDeltaDays = dragDeltaDaysRef.current
      const currentDragTaskId = dragTaskIdRef.current
      const currentDragType = dragTypeRef.current

      if (!currentDragTaskId || currentDeltaDays === 0) {
        setDragTaskId(null)
        setDragType(null)
        return
      }

      const task = localTasksRef.current.find((t) => t.id === currentDragTaskId)
      if (!task || !task.startDate || !task.dueDate) {
        setDragTaskId(null)
        setDragType(null)
        return
      }

      const startDate = new Date(task.startDate)
      const dueDate = new Date(task.dueDate)

      let newStart: Date
      let newEnd: Date

      if (currentDragType === 'move') {
        newStart = addDays(startDate, currentDeltaDays)
        newEnd = addDays(dueDate, currentDeltaDays)
      } else if (currentDragType === 'resize-start') {
        newStart = addDays(startDate, currentDeltaDays)
        newEnd = dueDate
        if (newStart >= newEnd) {
          newStart = addDays(newEnd, -1)
        }
      } else {
        newStart = startDate
        newEnd = addDays(dueDate, currentDeltaDays)
        if (newEnd <= newStart) {
          newEnd = addDays(newStart, 1)
        }
      }

      // Optimistic update
      setLocalTasks((prev) =>
        prev.map((t) =>
          t.id === currentDragTaskId
            ? { ...t, startDate: newStart.toISOString(), dueDate: newEnd.toISOString() }
            : t,
        ),
      )

      setDragTaskId(null)
      setDragType(null)
      dragDeltaDaysRef.current = 0
      setDragDeltaDays(0)

      try {
        const res = await fetch(`/api/tasks/${task.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            startDate: newStart.toISOString(),
            dueDate: newEnd.toISOString(),
          }),
        })

        if (!res.ok) {
          const json = await res.json()
          throw new Error(json.error?.message ?? '期限の更新に失敗しました')
        }

        toast.success('スケジュールを更新しました')
        router.refresh()
      } catch (error) {
        setLocalTasks(tasksRef.current)
        toast.error(
          error instanceof Error ? error.message : '期限の更新に失敗しました',
        )
      }
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [dragTaskId, dragType, timelineStart, timelineEnd, totalTimelineWidth, router])

  // Calculate drag-adjusted dates for a task
  const getDragAdjustedDates = (task: GanttTask): { startDate: Date; dueDate: Date } | null => {
    if (!task.startDate || !task.dueDate) return null

    let startDate = new Date(task.startDate)
    let dueDate = new Date(task.dueDate)

    if (dragTaskId === task.id && dragDeltaDays !== 0) {
      if (dragType === 'move') {
        startDate = addDays(startDate, dragDeltaDays)
        dueDate = addDays(dueDate, dragDeltaDays)
      } else if (dragType === 'resize-start') {
        startDate = addDays(startDate, dragDeltaDays)
        if (startDate >= dueDate) startDate = addDays(dueDate, -1)
      } else if (dragType === 'resize-end') {
        dueDate = addDays(dueDate, dragDeltaDays)
        if (dueDate <= startDate) dueDate = addDays(startDate, 1)
      }
    }

    return { startDate, dueDate }
  }

  // Calculate bar position for a task
  const getBarStyle = (task: GanttTask) => {
    const dates = getDragAdjustedDates(task)
    if (!dates) return null

    const left = dateToX(dates.startDate)
    const right = dateToX(dates.dueDate)
    const width = Math.max(right - left, 8)

    return { left, width }
  }

  // Format header labels
  const formatHeaderLabel = (date: Date) => {
    if (viewMode === 'day') {
      return format(date, 'd', { locale: ja })
    }
    if (viewMode === 'week') {
      const weekEnd = endOfWeek(date, { locale: ja })
      return `${format(date, 'M/d', { locale: ja })} - ${format(weekEnd, 'M/d', { locale: ja })}`
    }
    return format(date, 'yyyy年M月', { locale: ja })
  }

  // Format top-level header
  const formatTopHeader = (date: Date, index: number, cells: Date[]) => {
    if (viewMode === 'day') {
      if (index === 0 || !isSameMonth(date, cells[index - 1])) {
        return format(date, 'yyyy年M月', { locale: ja })
      }
      return null
    }
    if (viewMode === 'week') {
      if (index === 0 || !isSameMonth(date, cells[index - 1])) {
        return format(date, 'yyyy年M月', { locale: ja })
      }
      return null
    }
    // month
    if (index === 0 || date.getFullYear() !== cells[index - 1].getFullYear()) {
      return `${date.getFullYear()}年`
    }
    return null
  }

  const todayX = dateToX(today)

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* View mode toggle */}
        <div className="flex rounded-lg border border-foreground/10 overflow-hidden">
          {(['day', 'week', 'month'] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                viewMode === mode
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background text-foreground/60 hover:bg-foreground/5'
              }`}
            >
              {viewModeConfig[mode].label}
            </button>
          ))}
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => navigate('prev')}
            className="flex h-8 w-8 items-center justify-center rounded-md text-foreground/60 hover:bg-foreground/5"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={scrollToToday}
            className="flex h-8 items-center gap-1 rounded-md px-2 text-xs font-medium text-foreground/60 hover:bg-foreground/5"
          >
            <Calendar size={14} />
            今日
          </button>
          <button
            onClick={() => navigate('next')}
            className="flex h-8 w-8 items-center justify-center rounded-md text-foreground/60 hover:bg-foreground/5"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Grouping */}
        <div className="flex rounded-lg border border-foreground/10 overflow-hidden">
          <button
            onClick={() => setGroupBy('none')}
            className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium transition-colors ${
              groupBy === 'none'
                ? 'bg-primary text-primary-foreground'
                : 'bg-background text-foreground/60 hover:bg-foreground/5'
            }`}
          >
            なし
          </button>
          <button
            onClick={() => setGroupBy('category')}
            className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium transition-colors ${
              groupBy === 'category'
                ? 'bg-primary text-primary-foreground'
                : 'bg-background text-foreground/60 hover:bg-foreground/5'
            }`}
          >
            <Layers size={12} />
            カテゴリ
          </button>
          <button
            onClick={() => setGroupBy('assignee')}
            className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium transition-colors ${
              groupBy === 'assignee'
                ? 'bg-primary text-primary-foreground'
                : 'bg-background text-foreground/60 hover:bg-foreground/5'
            }`}
          >
            <User size={12} />
            担当者
          </button>
        </div>
      </div>

      {/* Unscheduled tasks warning */}
      {unscheduledTasks.length > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-warning/30 bg-warning/5 px-3 py-2 text-xs text-warning">
          <AlertTriangle size={14} />
          <span>
            開始日または期限が未設定のタスクが {unscheduledTasks.length} 件あります:
            {' '}
            {unscheduledTasks.slice(0, 5).map((t) => `${projectKey}-${t.taskNumber}`).join(', ')}
            {unscheduledTasks.length > 5 && ` 他${unscheduledTasks.length - 5}件`}
          </span>
        </div>
      )}

      {/* Chart area */}
      <div className="overflow-hidden rounded-lg border border-foreground/10">
        <div className="flex">
          {/* Left panel - Task names */}
          <div
            className="flex-shrink-0 border-r border-foreground/10 bg-background"
            style={{ width: LEFT_PANEL_WIDTH }}
          >
            {/* Left panel header */}
            <div
              className="flex items-center border-b border-foreground/10 px-3 text-xs font-medium text-foreground/60"
              style={{ height: HEADER_HEIGHT }}
            >
              タスク
            </div>

            {/* Left panel rows */}
            <div>
              {rows.map((row, index) => {
                if (row.type === 'group') {
                  return (
                    <div
                      key={`group-${row.group.key}`}
                      className="flex items-center gap-2 border-b border-foreground/5 bg-foreground/[0.02] px-3 text-xs font-semibold text-foreground/70"
                      style={{ height: TASK_ROW_HEIGHT }}
                    >
                      {row.group.color && (
                        <span
                          className="inline-block h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: row.group.color }}
                        />
                      )}
                      {row.group.label}
                      <span className="text-foreground/40">({row.group.tasks.length})</span>
                    </div>
                  )
                }

                const task = row.task
                return (
                  <div
                    key={`${row.groupKey}-${task.id}`}
                    className="flex items-center gap-2 border-b border-foreground/5 px-3 text-xs hover:bg-foreground/[0.02]"
                    style={{ height: TASK_ROW_HEIGHT }}
                  >
                    <span className="flex-shrink-0 text-foreground/40">
                      {projectKey}-{task.taskNumber}
                    </span>
                    <span className="truncate text-foreground" title={task.title}>
                      {task.title}
                    </span>
                    {task.assignee && (
                      <span
                        className="ml-auto flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-primary/20 text-[10px] font-medium text-primary"
                        title={task.assignee.name}
                      >
                        {task.assignee.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Right panel - Timeline */}
          <div
            ref={scrollContainerRef}
            className="flex-1 overflow-x-auto"
          >
            <div style={{ width: totalTimelineWidth, minWidth: '100%' }}>
              {/* Timeline header */}
              <div
                className="sticky top-0 z-10 border-b border-foreground/10 bg-background"
                style={{ height: HEADER_HEIGHT }}
              >
                {/* Top header row (month/year labels) */}
                <div className="flex h-7 border-b border-foreground/5">
                  {timeCells.map((date, i) => {
                    const topLabel = formatTopHeader(date, i, timeCells)
                    if (!topLabel) return null

                    let spanCount = 1
                    for (let j = i + 1; j < timeCells.length; j++) {
                      const nextTop = formatTopHeader(timeCells[j], j, timeCells)
                      if (nextTop) break
                      spanCount++
                    }

                    return (
                      <div
                        key={`top-${i}`}
                        className="flex items-center border-r border-foreground/5 px-2 text-[10px] font-medium text-foreground/50"
                        style={{
                          width: spanCount * viewModeConfig[viewMode].cellWidth,
                          position: 'absolute',
                          left: i * viewModeConfig[viewMode].cellWidth,
                        }}
                      >
                        {topLabel}
                      </div>
                    )
                  })}
                </div>

                {/* Bottom header row (day/week/month labels) */}
                <div className="relative flex" style={{ height: HEADER_HEIGHT - 28 }}>
                  {timeCells.map((date, i) => (
                    <div
                      key={`cell-${i}`}
                      className={`flex flex-shrink-0 items-center justify-center border-r border-foreground/5 text-[10px] ${
                        isSameDay(date, today)
                          ? 'bg-primary/10 font-bold text-primary'
                          : viewMode === 'day' && isWeekend(date)
                            ? 'text-foreground/30'
                            : 'text-foreground/50'
                      }`}
                      style={{ width: viewModeConfig[viewMode].cellWidth }}
                    >
                      {formatHeaderLabel(date)}
                    </div>
                  ))}
                </div>
              </div>

              {/* Chart rows */}
              <div className="relative">
                {/* Grid lines */}
                <div className="pointer-events-none absolute inset-0">
                  {timeCells.map((date, i) => (
                    <div
                      key={`grid-${i}`}
                      className={`absolute top-0 bottom-0 border-r ${
                        viewMode === 'day' && isWeekend(date)
                          ? 'bg-foreground/[0.02] border-foreground/5'
                          : 'border-foreground/5'
                      }`}
                      style={{
                        left: i * viewModeConfig[viewMode].cellWidth,
                        width: viewModeConfig[viewMode].cellWidth,
                      }}
                    />
                  ))}
                </div>

                {/* Today line */}
                <div
                  className="pointer-events-none absolute top-0 bottom-0 z-20 w-0.5 bg-danger/70"
                  style={{ left: todayX }}
                >
                  <div className="absolute -top-0.5 -left-1 h-2 w-2 rounded-full bg-danger" />
                </div>

                {/* Task bars */}
                {rows.map((row) => {
                  if (row.type === 'group') {
                    return (
                      <div
                        key={`gantt-group-${row.group.key}`}
                        className="border-b border-foreground/5 bg-foreground/[0.02]"
                        style={{ height: TASK_ROW_HEIGHT }}
                      />
                    )
                  }

                  const task = row.task
                  const barStyle = getBarStyle(task)

                  return (
                    <div
                      key={`gantt-task-${row.groupKey}-${task.id}`}
                      className="relative border-b border-foreground/5"
                      style={{ height: TASK_ROW_HEIGHT }}
                    >
                      {barStyle && (
                        <div
                          className={`group absolute top-2 flex h-6 items-center rounded-md shadow-sm transition-shadow hover:shadow-md ${
                            dragTaskId === task.id ? 'opacity-80 shadow-md' : ''
                          }`}
                          style={{
                            left: barStyle.left,
                            width: barStyle.width,
                            backgroundColor: `color-mix(in oklch, ${priorityColors[task.priority]} 25%, oklch(0.85 0.02 255))`,
                            borderLeft: `3px solid ${priorityColors[task.priority]}`,
                          }}
                        >
                          {/* Resize handle - start */}
                          <div
                            className="absolute -left-1 top-0 bottom-0 w-2 cursor-ew-resize opacity-0 group-hover:opacity-100"
                            onMouseDown={(e) => handleBarMouseDown(e, task.id, 'resize-start')}
                          >
                            <div className="flex h-full items-center justify-center">
                              <GripVertical size={10} className="text-foreground/40" />
                            </div>
                          </div>

                          {/* Bar content - draggable */}
                          <div
                            className="flex-1 cursor-grab overflow-hidden px-2 text-[10px] font-medium text-foreground/70 active:cursor-grabbing"
                            onMouseDown={(e) => handleBarMouseDown(e, task.id, 'move')}
                          >
                            <span className="truncate">
                              {barStyle.width > 60 ? task.title : ''}
                            </span>
                          </div>

                          {/* Resize handle - end */}
                          <div
                            className="absolute -right-1 top-0 bottom-0 w-2 cursor-ew-resize opacity-0 group-hover:opacity-100"
                            onMouseDown={(e) => handleBarMouseDown(e, task.id, 'resize-end')}
                          >
                            <div className="flex h-full items-center justify-center">
                              <GripVertical size={10} className="text-foreground/40" />
                            </div>
                          </div>

                          {/* Tooltip */}
                          {(() => {
                            const dates = getDragAdjustedDates(task)
                            return (
                              <div className="pointer-events-none absolute -top-10 left-0 z-30 hidden rounded-md border border-foreground/10 bg-background px-2 py-1 text-[10px] shadow-md group-hover:block">
                                <span className="font-medium">{projectKey}-{task.taskNumber}</span>
                                <span className="ml-1 text-foreground/50">
                                  {dates && format(dates.startDate, 'M/d', { locale: ja })}
                                  {' → '}
                                  {dates && format(dates.dueDate, 'M/d', { locale: ja })}
                                </span>
                              </div>
                            )
                          })()}
                        </div>
                      )}
                    </div>
                  )
                })}

                {rows.length === 0 && (
                  <div
                    className="flex items-center justify-center text-sm text-foreground/40"
                    style={{ height: TASK_ROW_HEIGHT * 3 }}
                  >
                    スケジュールが設定されたタスクがありません
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
