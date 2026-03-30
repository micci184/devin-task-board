'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import { Filter } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'

import { KanbanColumn } from '@/components/board/KanbanColumn'
import { TaskCard } from '@/components/tasks/TaskCard'

import type { DragEndEvent, DragOverEvent, DragStartEvent } from '@dnd-kit/core'
import type { Priority, TaskStatus } from '@prisma/client'

interface TaskCategory {
  category: {
    id: string
    name: string
    color: string
  }
}

interface Task {
  id: string
  taskNumber: number
  title: string
  priority: Priority
  status: TaskStatus
  sortOrder: number
  dueDate: string | Date | null
  assignee: {
    id: string
    name: string
    avatarUrl: string | null
  } | null
  taskCategories?: TaskCategory[]
}

interface CategoryItem {
  id: string
  name: string
  color: string
}

interface KanbanBoardProps {
  tasks: Task[]
  projectId: string
  projectKey: string
  categories: CategoryItem[]
}

const columnStatuses: TaskStatus[] = ['BACKLOG', 'TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE']

const SORT_ORDER_GAP = 1000

export const KanbanBoard = ({ tasks, projectId, projectKey, categories }: KanbanBoardProps) => {
  const router = useRouter()
  const t = useTranslations('tasks')
  const tStatus = useTranslations('status')
  const tCommon = useTranslations('common')
  const tBoard = useTranslations('board')
  const [localTasks, setLocalTasks] = useState<Task[]>(tasks)
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null)
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([])
  const [showCategoryFilter, setShowCategoryFilter] = useState(false)
  const dragOriginalStatusRef = useRef<TaskStatus | null>(null)

  useEffect(() => {
    setLocalTasks(tasks)
  }, [tasks])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
  )

  const activeTask = activeTaskId
    ? localTasks.find((t) => t.id === activeTaskId) ?? null
    : null

  const getTasksByStatus = (status: TaskStatus) =>
    localTasks
      .filter((t) => t.status === status)
      .sort((a, b) => a.sortOrder - b.sortOrder)

  const handleQuickCreate = async (status: TaskStatus, title: string) => {
    const tasksInColumn = getTasksByStatus(status)
    const maxSort = tasksInColumn.length > 0
      ? tasksInColumn[tasksInColumn.length - 1].sortOrder
      : 0

    const tempId = `temp-${Date.now()}`
    const optimisticTask: Task = {
      id: tempId,
      taskNumber: 0,
      title,
      priority: 'NONE',
      status,
      sortOrder: maxSort + SORT_ORDER_GAP,
      dueDate: null,
      assignee: null,
    }

    setLocalTasks((prev) => [...prev, optimisticTask])

    try {
      const res = await fetch(`/api/projects/${projectId}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, status }),
      })

      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error?.message ?? tBoard('createError'))
      }

      const json = await res.json()
      const created = json.data as Task

      setLocalTasks((prev) =>
        prev.map((item) => (item.id === tempId ? { ...created, sortOrder: optimisticTask.sortOrder } : item)),
      )

      toast.success(tBoard('createSuccess'))
      router.refresh()
    } catch (error) {
      setLocalTasks((prev) => prev.filter((item) => item.id !== tempId))
      toast.error(
        error instanceof Error ? error.message : tBoard('createError'),
      )
    }
  }

  const handleDragStart = (event: DragStartEvent) => {
    const taskId = event.active.id as string
    const task = localTasks.find((t) => t.id === taskId)
    dragOriginalStatusRef.current = task?.status ?? null
    setActiveTaskId(taskId)
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event
    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    const activeTaskItem = localTasks.find((t) => t.id === activeId)
    if (!activeTaskItem) return

    let overStatus: TaskStatus | undefined
    if (columnStatuses.includes(overId as TaskStatus)) {
      overStatus = overId as TaskStatus
    } else {
      const overTask = localTasks.find((t) => t.id === overId)
      if (overTask) {
        overStatus = overTask.status
      }
    }

    if (!overStatus || activeTaskItem.status === overStatus) return

    setLocalTasks((prev) => {
      const tasksInTarget = prev
        .filter((t) => t.status === overStatus && t.id !== activeId)
        .sort((a, b) => a.sortOrder - b.sortOrder)

      const newSortOrder = tasksInTarget.length > 0
        ? tasksInTarget[tasksInTarget.length - 1].sortOrder + SORT_ORDER_GAP
        : SORT_ORDER_GAP

      return prev.map((t) =>
        t.id === activeId
          ? { ...t, status: overStatus, sortOrder: newSortOrder }
          : t,
      )
    })
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveTaskId(null)

    const { active, over } = event
    if (!over) {
      dragOriginalStatusRef.current = null
      setLocalTasks(tasks)
      return
    }

    const activeId = active.id as string
    const overId = over.id as string

    const task = localTasks.find((t) => t.id === activeId)
    if (!task) {
      dragOriginalStatusRef.current = null
      return
    }

    const originalStatus = dragOriginalStatusRef.current
    const currentStatus = originalStatus ?? task.status
    dragOriginalStatusRef.current = null

    if (activeId === overId && currentStatus === task.status) {
      setLocalTasks(tasks)
      return
    }

    const isOverColumn = columnStatuses.includes(overId as TaskStatus)
    const overTask = !isOverColumn ? localTasks.find((t) => t.id === overId) : null

    const targetStatus = isOverColumn
      ? (overId as TaskStatus)
      : overTask
        ? overTask.status
        : currentStatus

    const previousTasks = [...localTasks]

    // Same column reorder
    if (currentStatus === targetStatus && !isOverColumn) {
      const tasksInColumn = getTasksByStatus(currentStatus)
      const oldIndex = tasksInColumn.findIndex((t) => t.id === activeId)
      const newIndex = tasksInColumn.findIndex((t) => t.id === overId)

      if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return

      const reordered = arrayMove(tasksInColumn, oldIndex, newIndex)
      const updates = reordered.map((t, i) => ({
        id: t.id,
        sortOrder: (i + 1) * SORT_ORDER_GAP,
      }))

      setLocalTasks((prev) =>
        prev.map((t) => {
          const update = updates.find((u) => u.id === t.id)
          return update ? { ...t, sortOrder: update.sortOrder } : t
        }),
      )

      try {
        await Promise.all(
          updates.map((u) =>
            fetch(`/api/tasks/${u.id}/sort`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ sortOrder: u.sortOrder }),
            }).then(async (res) => {
              if (!res.ok) {
                const json = await res.json()
                throw new Error(json.error?.message ?? tBoard('sortError'))
              }
            }),
          ),
        )
        router.refresh()
      } catch (error) {
        setLocalTasks(previousTasks)
        toast.error(
          error instanceof Error ? error.message : tBoard('sortError'),
        )
      }
      return
    }

    // Cross-column move
    if (currentStatus !== targetStatus) {
      const targetTasks = localTasks
        .filter((t) => t.status === targetStatus && t.id !== activeId)
        .sort((a, b) => a.sortOrder - b.sortOrder)

      let allUpdates: { id: string; sortOrder: number }[]
      if (overTask) {
        const overIndex = targetTasks.findIndex((t) => t.id === overId)
        const tasksWithActive = [...targetTasks]
        tasksWithActive.splice(overIndex + 1, 0, { ...task, status: targetStatus })
        allUpdates = tasksWithActive.map((t, i) => ({
          id: t.id,
          sortOrder: (i + 1) * SORT_ORDER_GAP,
        }))
      } else {
        const newSortOrder = targetTasks.length > 0
          ? targetTasks[targetTasks.length - 1].sortOrder + SORT_ORDER_GAP
          : SORT_ORDER_GAP
        allUpdates = [{ id: activeId, sortOrder: newSortOrder }]
      }

      const activeUpdate = allUpdates.find((u) => u.id === activeId)
      const newSortOrder = activeUpdate?.sortOrder ?? SORT_ORDER_GAP

      setLocalTasks((prev) =>
        prev.map((t) => {
          if (t.id === activeId) {
            return { ...t, status: targetStatus, sortOrder: newSortOrder }
          }
          const update = allUpdates.find((u) => u.id === t.id)
          return update ? { ...t, sortOrder: update.sortOrder } : t
        }),
      )

      try {
        await Promise.all(
          allUpdates.map((u) =>
            fetch(`/api/tasks/${u.id}/sort`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                sortOrder: u.sortOrder,
                ...(u.id === activeId ? { status: targetStatus } : {}),
              }),
            }).then(async (res) => {
              if (!res.ok) {
                const json = await res.json()
                throw new Error(json.error?.message ?? tBoard('statusUpdateError'))
              }
            }),
          ),
        )
        router.refresh()
      } catch (error) {
        setLocalTasks(tasks)
        toast.error(
          error instanceof Error ? error.message : tBoard('statusUpdateError'),
        )
      }
    }
  }

  const handleDragCancel = () => {
    setActiveTaskId(null)
    dragOriginalStatusRef.current = null
    setLocalTasks(tasks)
  }

  const toggleCategoryFilter = (categoryId: string) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId],
    )
  }

  const filteredTasks = selectedCategoryIds.length > 0
    ? localTasks.filter((t) =>
        t.taskCategories?.some((tc) => selectedCategoryIds.includes(tc.category.id)),
      )
    : localTasks

  return (
    <>
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
                  onClick={() => setSelectedCategoryIds([])}
                  className="rounded-full px-2.5 py-0.5 text-xs font-medium text-foreground/50 hover:text-foreground/80"
                >
                  {tCommon('clear')}
                </button>
              )}
            </div>
          )}
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {columnStatuses.map((status) => (
            <KanbanColumn
              key={status}
              status={status}
              label={tStatus(status)}
              tasks={filteredTasks.filter((item) => item.status === status).sort((a, b) => a.sortOrder - b.sortOrder)}
              projectKey={projectKey}
              onQuickCreate={handleQuickCreate}
              activeTaskId={activeTaskId}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask ? (
            <div className="rotate-3 opacity-90">
              <TaskCard task={activeTask} projectKey={projectKey} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

    </>
  )
}
