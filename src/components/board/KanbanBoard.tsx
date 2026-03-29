'use client'

import { useEffect, useState } from 'react'
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
import { toast } from 'sonner'

import { KanbanColumn } from '@/components/board/KanbanColumn'
import { TaskCard } from '@/components/tasks/TaskCard'

import type { DragEndEvent, DragOverEvent, DragStartEvent } from '@dnd-kit/core'
import type { Priority, TaskStatus } from '@prisma/client'

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
}

interface KanbanBoardProps {
  tasks: Task[]
  projectId: string
  projectKey: string
}

const columns: { status: TaskStatus; label: string }[] = [
  { status: 'BACKLOG', label: 'Backlog' },
  { status: 'TODO', label: 'Todo' },
  { status: 'IN_PROGRESS', label: 'In Progress' },
  { status: 'IN_REVIEW', label: 'In Review' },
  { status: 'DONE', label: 'Done' },
]

const SORT_ORDER_GAP = 1000

export const KanbanBoard = ({ tasks, projectId, projectKey }: KanbanBoardProps) => {
  const router = useRouter()
  const [localTasks, setLocalTasks] = useState<Task[]>(tasks)
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null)

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
        throw new Error(json.error?.message ?? 'タスクの作成に失敗しました')
      }

      const json = await res.json()
      const created = json.data as Task

      setLocalTasks((prev) =>
        prev.map((t) => (t.id === tempId ? { ...created, sortOrder: optimisticTask.sortOrder } : t)),
      )

      toast.success('タスクを作成しました')
      router.refresh()
    } catch (error) {
      setLocalTasks((prev) => prev.filter((t) => t.id !== tempId))
      toast.error(
        error instanceof Error ? error.message : 'タスクの作成に失敗しました',
      )
    }
  }

  const handleDragStart = (event: DragStartEvent) => {
    setActiveTaskId(event.active.id as string)
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event
    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    const activeTaskItem = localTasks.find((t) => t.id === activeId)
    if (!activeTaskItem) return

    const validStatuses = columns.map((c) => c.status)

    let overStatus: TaskStatus | undefined
    if (validStatuses.includes(overId as TaskStatus)) {
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
    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    if (activeId === overId) return

    const task = localTasks.find((t) => t.id === activeId)
    if (!task) return

    const validStatuses = columns.map((c) => c.status)
    const currentStatus = task.status

    const isOverColumn = validStatuses.includes(overId as TaskStatus)
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
                throw new Error(json.error?.message ?? '並び順の更新に失敗しました')
              }
            }),
          ),
        )
        router.refresh()
      } catch (error) {
        setLocalTasks(previousTasks)
        toast.error(
          error instanceof Error ? error.message : '並び順の更新に失敗しました',
        )
      }
      return
    }

    // Cross-column move
    if (currentStatus !== targetStatus) {
      const targetTasks = localTasks
        .filter((t) => t.status === targetStatus && t.id !== activeId)
        .sort((a, b) => a.sortOrder - b.sortOrder)

      let newSortOrder: number
      if (overTask) {
        const overIndex = targetTasks.findIndex((t) => t.id === overId)
        const tasksWithActive = [...targetTasks]
        tasksWithActive.splice(overIndex + 1, 0, task)
        const reordered = tasksWithActive.map((t, i) => ({
          id: t.id,
          sortOrder: (i + 1) * SORT_ORDER_GAP,
        }))
        const activeUpdate = reordered.find((u) => u.id === activeId)
        newSortOrder = activeUpdate ? activeUpdate.sortOrder : (targetTasks.length + 1) * SORT_ORDER_GAP
      } else {
        newSortOrder = targetTasks.length > 0
          ? targetTasks[targetTasks.length - 1].sortOrder + SORT_ORDER_GAP
          : SORT_ORDER_GAP
      }

      setLocalTasks((prev) =>
        prev.map((t) =>
          t.id === activeId
            ? { ...t, status: targetStatus, sortOrder: newSortOrder }
            : t,
        ),
      )

      try {
        const res = await fetch(`/api/tasks/${activeId}/sort`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sortOrder: newSortOrder, status: targetStatus }),
        })

        if (!res.ok) {
          const json = await res.json()
          throw new Error(json.error?.message ?? 'ステータスの更新に失敗しました')
        }

        router.refresh()
      } catch (error) {
        setLocalTasks(previousTasks)
        toast.error(
          error instanceof Error ? error.message : 'ステータスの更新に失敗しました',
        )
      }
    }
  }

  const handleDragCancel = () => {
    setActiveTaskId(null)
    setLocalTasks(tasks)
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {columns.map((col) => (
            <KanbanColumn
              key={col.status}
              status={col.status}
              label={col.label}
              tasks={getTasksByStatus(col.status)}
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
