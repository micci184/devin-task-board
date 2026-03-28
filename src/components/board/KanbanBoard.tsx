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
import { toast } from 'sonner'

import { KanbanColumn } from '@/components/board/KanbanColumn'
import { TaskCard } from '@/components/tasks/TaskCard'
import { TaskCreateModal } from '@/components/tasks/TaskCreateModal'

import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core'
import type { Priority, TaskStatus } from '@prisma/client'

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

export const KanbanBoard = ({ tasks, projectId, projectKey }: KanbanBoardProps) => {
  const router = useRouter()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [defaultStatus, setDefaultStatus] = useState<TaskStatus>('BACKLOG')
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

  const handleQuickCreate = (status: TaskStatus) => {
    setDefaultStatus(status)
    setShowCreateModal(true)
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

  return (
    <>
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
              tasks={localTasks.filter((t) => t.status === col.status)}
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

      {showCreateModal && (
        <TaskCreateModal
          projectId={projectId}
          defaultStatus={defaultStatus}
          onClose={() => setShowCreateModal(false)}
        />
      )}
    </>
  )
}
