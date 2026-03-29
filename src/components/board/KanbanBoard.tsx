'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { Filter } from 'lucide-react'
import { toast } from 'sonner'

import { KanbanColumn } from '@/components/board/KanbanColumn'
import { TaskCard } from '@/components/tasks/TaskCard'

import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core'
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

const columns: { status: TaskStatus; label: string }[] = [
  { status: 'BACKLOG', label: 'Backlog' },
  { status: 'TODO', label: 'Todo' },
  { status: 'IN_PROGRESS', label: 'In Progress' },
  { status: 'IN_REVIEW', label: 'In Review' },
  { status: 'DONE', label: 'Done' },
]

export const KanbanBoard = ({ tasks, projectId, projectKey, categories }: KanbanBoardProps) => {
  const router = useRouter()
  const [localTasks, setLocalTasks] = useState<Task[]>(tasks)
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null)
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([])
  const [showCategoryFilter, setShowCategoryFilter] = useState(false)

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

  const handleQuickCreate = async (status: TaskStatus, title: string) => {
    const tempId = `temp-${Date.now()}`
    const optimisticTask: Task = {
      id: tempId,
      taskNumber: 0,
      title,
      priority: 'NONE',
      status,
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
        prev.map((t) => (t.id === tempId ? created : t)),
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

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveTaskId(null)

    const { active, over } = event
    if (!over) return

    const taskId = active.id as string
    const newStatus = over.id as TaskStatus

    const validStatuses = columns.map((c) => c.status)
    if (!validStatuses.includes(newStatus)) return

    const task = localTasks.find((t) => t.id === taskId)
    if (!task || task.status === newStatus) return

    const oldStatus = task.status

    setLocalTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)),
    )

    try {
      const res = await fetch(`/api/tasks/${taskId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error?.message ?? 'ステータスの更新に失敗しました')
      }

      router.refresh()
    } catch (error) {
      setLocalTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: oldStatus } : t)),
      )
      toast.error(
        error instanceof Error ? error.message : 'ステータスの更新に失敗しました',
      )
    }
  }

  const handleDragCancel = () => {
    setActiveTaskId(null)
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
            カテゴリ
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
                  クリア
                </button>
              )}
            </div>
          )}
        </div>
      )}

      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {columns.map((col) => (
            <KanbanColumn
              key={col.status}
              status={col.status}
              label={col.label}
              tasks={filteredTasks.filter((t) => t.status === col.status)}
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
