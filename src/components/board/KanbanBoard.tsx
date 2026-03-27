'use client'

import { useState } from 'react'

import { KanbanColumn } from '@/components/board/KanbanColumn'
import { TaskCreateModal } from '@/components/tasks/TaskCreateModal'

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
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [defaultStatus, setDefaultStatus] = useState<TaskStatus>('BACKLOG')

  const handleQuickCreate = (status: TaskStatus) => {
    setDefaultStatus(status)
    setShowCreateModal(true)
  }

  return (
    <>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map((col) => (
          <KanbanColumn
            key={col.status}
            status={col.status}
            label={col.label}
            tasks={tasks.filter((t) => t.status === col.status)}
            projectKey={projectKey}
            onQuickCreate={handleQuickCreate}
          />
        ))}
      </div>

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
