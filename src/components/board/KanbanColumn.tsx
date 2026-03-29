'use client'

import { useRef, useState } from 'react'

import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Plus } from 'lucide-react'

import { SortableTaskCard } from '@/components/tasks/TaskCard'

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

interface KanbanColumnProps {
  status: TaskStatus
  label: string
  tasks: Task[]
  projectKey: string
  onQuickCreate: (status: TaskStatus, title: string) => Promise<void>
  activeTaskId: string | null
}

export const KanbanColumn = ({
  status,
  label,
  tasks,
  projectKey,
  onQuickCreate,
  activeTaskId,
}: KanbanColumnProps) => {
  const { setNodeRef, isOver } = useDroppable({ id: status })
  const [isCreating, setIsCreating] = useState(false)
  const [title, setTitle] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleOpenForm = () => {
    setIsCreating(true)
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  const handleCancel = () => {
    setIsCreating(false)
    setTitle('')
  }

  const handleSubmit = async () => {
    const trimmed = title.trim()
    if (!trimmed || submitting) return

    setSubmitting(true)
    try {
      await onQuickCreate(status, trimmed)
      setTitle('')
      setTimeout(() => inputRef.current?.focus(), 0)
    } finally {
      setSubmitting(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSubmit()
    } else if (e.key === 'Escape') {
      handleCancel()
    }
  }

  return (
    <div
      ref={setNodeRef}
      className={`flex w-72 shrink-0 flex-col rounded-lg transition-colors ${
        isOver
          ? "bg-primary/10 ring-2 ring-primary/40"
          : "bg-foreground/3"
      }`}
    >
      <div className="flex items-center justify-between px-3 py-2">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-foreground/70">{label}</h3>
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-foreground/10 px-1.5 text-xs text-foreground/50">
            {tasks.length}
          </span>
        </div>
        <button
          onClick={handleOpenForm}
          className="flex h-6 w-6 items-center justify-center rounded text-foreground/40 hover:bg-foreground/10 hover:text-foreground"
          aria-label={`${label}にタスクを追加`}
        >
          <Plus size={14} />
        </button>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto px-2 pb-2">
        {isCreating && (
          <div className="rounded-lg border border-primary/40 bg-background p-2 shadow-sm">
            <input
              ref={inputRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={() => {
                if (!title.trim()) handleCancel()
              }}
              placeholder="タイトルを入力..."
              disabled={submitting}
              className="w-full rounded border border-foreground/20 bg-background px-2 py-1.5 text-sm text-foreground placeholder:text-foreground/40 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
            />
            <p className="mt-1 text-xs text-foreground/40">
              Enter で作成 / Esc でキャンセル
            </p>
          </div>
        )}
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <SortableTaskCard
              key={task.id}
              task={task}
              projectKey={projectKey}
              isDragOverlay={activeTaskId === task.id}
            />
          ))}
        </SortableContext>
      </div>
    </div>
  )
}
