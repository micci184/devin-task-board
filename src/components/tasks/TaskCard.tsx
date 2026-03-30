'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Calendar } from 'lucide-react'
import { format } from 'date-fns'
import { useTranslations } from 'next-intl'

import type { Priority } from '@prisma/client'

interface TaskCategory {
  category: {
    id: string
    name: string
    color: string
  }
}

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
    taskCategories?: TaskCategory[]
  }
  projectKey: string
}

interface SortableTaskCardProps extends TaskCardProps {
  isDragOverlay: boolean
}

const priorityClassNames: Record<Priority, string> = {
  URGENT: 'bg-danger/10 text-danger',
  HIGH: 'bg-warning/10 text-warning',
  MEDIUM: 'bg-primary/10 text-primary',
  LOW: 'bg-foreground/10 text-foreground/60',
  NONE: 'bg-foreground/5 text-foreground/40',
}

export const TaskCard = ({ task, projectKey }: TaskCardProps) => {
  const tPriority = useTranslations('priority')
  const dueDate = task.dueDate ? new Date(task.dueDate) : null
  const isOverdue = dueDate ? dueDate < new Date() : false

  return (
    <div className="rounded-lg border border-foreground/10 bg-background p-3 shadow-sm transition-shadow hover:shadow-md">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs text-foreground/40">
          {projectKey}-{task.taskNumber}
        </span>
        {task.priority !== 'NONE' && (
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${priorityClassNames[task.priority]}`}>
            {tPriority(task.priority)}
          </span>
        )}
      </div>

      <p className="text-sm font-medium text-foreground">{task.title}</p>

      {task.taskCategories && task.taskCategories.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {task.taskCategories.map((tc) => (
            <span
              key={tc.category.id}
              className="rounded-full px-1.5 py-0.5 text-[10px] font-medium"
              style={{
                backgroundColor: `color-mix(in oklch, ${tc.category.color} 15%, transparent)`,
                color: tc.category.color,
              }}
            >
              {tc.category.name}
            </span>
          ))}
        </div>
      )}

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

export const SortableTaskCard = ({ task, projectKey, isDragOverlay }: SortableTaskCardProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={isDragging || isDragOverlay ? 'opacity-30' : ''}
    >
      <TaskCard task={task} projectKey={projectKey} />
    </div>
  )
}
