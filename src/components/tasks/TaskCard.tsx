import { useDraggable } from '@dnd-kit/core'
import { Calendar } from 'lucide-react'
import { format } from 'date-fns'

import type { Priority } from '@prisma/client'

interface TaskCardProps {
  task: {
    id: string
    taskNumber: number
    title: string
    priority: Priority
    dueDate: string | Date | null
    assignee: {
      id: string
      name: string
      avatarUrl: string | null
    } | null
  }
  projectKey: string
}

interface DraggableTaskCardProps extends TaskCardProps {
  isDragOverlay: boolean
}

const priorityConfig: Record<Priority, { label: string; className: string }> = {
  URGENT: { label: '緊急', className: 'bg-danger/10 text-danger' },
  HIGH: { label: '高', className: 'bg-warning/10 text-warning' },
  MEDIUM: { label: '中', className: 'bg-primary/10 text-primary' },
  LOW: { label: '低', className: 'bg-foreground/10 text-foreground/60' },
  NONE: { label: '-', className: 'bg-foreground/5 text-foreground/40' },
}

export const TaskCard = ({ task, projectKey }: TaskCardProps) => {
  const priority = priorityConfig[task.priority]
  const dueDate = task.dueDate ? new Date(task.dueDate) : null
  const isOverdue = dueDate ? dueDate < new Date() : false

  return (
    <div className="rounded-lg border border-foreground/10 bg-background p-3 shadow-sm transition-shadow hover:shadow-md">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs text-foreground/40">
          {projectKey}-{task.taskNumber}
        </span>
        {task.priority !== 'NONE' && (
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${priority.className}`}>
            {priority.label}
          </span>
        )}
      </div>

      <p className="text-sm font-medium text-foreground">{task.title}</p>

      <div className="mt-3 flex items-center justify-between">
        {dueDate && (
          <div className={`flex items-center gap-1 text-xs ${isOverdue ? 'text-danger' : 'text-foreground/50'}`}>
            <Calendar size={12} />
            <span>{format(dueDate, 'M/d')}</span>
          </div>
        )}
        {!dueDate && <div />}

        {task.assignee && (
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-xs font-medium text-primary" title={task.assignee.name}>
            {task.assignee.name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
    </div>
  )
}

export const DraggableTaskCard = ({ task, projectKey, isDragOverlay }: DraggableTaskCardProps) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: task.id,
  })

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={isDragging || isDragOverlay ? 'opacity-30' : ''}
    >
      <TaskCard task={task} projectKey={projectKey} />
    </div>
  )
}
