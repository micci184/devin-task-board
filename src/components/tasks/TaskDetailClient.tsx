'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  Flag,
  Tag,
  ListTodo,
  MessageSquare,
  Activity,
  Check,
  X,
  Pencil,
  ChevronDown,
  Trash2,
  Plus,
} from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'

import { MarkdownPreview } from '@/components/tasks/MarkdownPreview'

import type { Priority, TaskStatus } from '@prisma/client'

interface TaskMember {
  id: string
  name: string
  avatarUrl: string | null
}

interface TaskCategory {
  category: {
    id: string
    name: string
    color: string
  }
}

interface TaskSubtask {
  id: string
  taskNumber: number
  title: string
  status: TaskStatus
  priority: Priority
  dueDate: string | Date | null
  assignee: TaskMember | null
}

interface TaskData {
  id: string
  taskNumber: number
  title: string
  description: string | null
  status: TaskStatus
  priority: Priority
  dueDate: string | Date | null
  estimatedHours: number | null
  actualHours: number | null
  projectId: string
  project: { id: string; name: string; key: string }
  assignee: TaskMember | null
  reporter: TaskMember
  taskCategories: TaskCategory[]
  subtasks: TaskSubtask[]
}

interface ProjectMemberItem {
  id: string
  userId: string
  user: { id: string; name: string; avatarUrl: string | null }
}

interface TaskDetailClientProps {
  task: TaskData
  projectMembers: ProjectMemberItem[]
  canEdit: boolean
}

const statusConfig: Record<TaskStatus, { label: string; className: string }> = {
  BACKLOG: { label: 'Backlog', className: 'bg-foreground/10 text-foreground/60' },
  TODO: { label: 'Todo', className: 'bg-primary/10 text-primary' },
  IN_PROGRESS: { label: 'In Progress', className: 'bg-warning/10 text-warning' },
  IN_REVIEW: { label: 'In Review', className: 'bg-primary/10 text-primary' },
  DONE: { label: 'Done', className: 'bg-success/10 text-success' },
}

const priorityConfig: Record<Priority, { label: string; className: string }> = {
  URGENT: { label: '緊急', className: 'bg-danger/10 text-danger' },
  HIGH: { label: '高', className: 'bg-warning/10 text-warning' },
  MEDIUM: { label: '中', className: 'bg-primary/10 text-primary' },
  LOW: { label: '低', className: 'bg-foreground/10 text-foreground/60' },
  NONE: { label: 'なし', className: 'bg-foreground/5 text-foreground/40' },
}

const statusOptions: TaskStatus[] = ['BACKLOG', 'TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE']
const priorityOptions: Priority[] = ['URGENT', 'HIGH', 'MEDIUM', 'LOW', 'NONE']

const updateTask = async (taskId: string, data: Record<string, unknown>) => {
  const res = await fetch(`/api/tasks/${taskId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })

  if (!res.ok) {
    const json = await res.json()
    throw new Error(json.error?.message ?? 'タスクの更新に失敗しました')
  }

  const json = await res.json()
  return json.data as TaskData
}

// --- Inline Edit Components ---

const InlineEditTitle = ({
  value,
  taskId,
  canEdit,
  onUpdated,
}: {
  value: string
  taskId: string
  canEdit: boolean
  onUpdated: (task: TaskData) => void
}) => {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editing])

  const handleSave = async () => {
    const trimmed = draft.trim()
    if (!trimmed || trimmed === value) {
      setDraft(value)
      setEditing(false)
      return
    }
    try {
      const updated = await updateTask(taskId, { title: trimmed })
      onUpdated(updated)
      toast.success('タイトルを更新しました')
      setEditing(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'タイトルの更新に失敗しました')
      setDraft(value)
      setEditing(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave()
    if (e.key === 'Escape') {
      setDraft(value)
      setEditing(false)
    }
  }

  if (!canEdit) {
    return <h1 className="text-2xl font-bold text-foreground">{value}</h1>
  }

  if (editing) {
    return (
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          className="w-full rounded-md border border-foreground/20 bg-background px-2 py-1 text-2xl font-bold text-foreground outline-none focus:border-primary"
          maxLength={255}
        />
      </div>
    )
  }

  return (
    <h1
      className="group cursor-pointer text-2xl font-bold text-foreground"
      onClick={() => setEditing(true)}
      title="クリックして編集"
    >
      {value}
      <Pencil size={14} className="ml-2 inline opacity-0 transition-opacity group-hover:opacity-40" />
    </h1>
  )
}

const InlineEditDescription = ({
  value,
  taskId,
  canEdit,
  onUpdated,
}: {
  value: string | null
  taskId: string
  canEdit: boolean
  onUpdated: (task: TaskData) => void
}) => {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value ?? '')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (editing && textareaRef.current) {
      textareaRef.current.focus()
      const len = textareaRef.current.value.length
      textareaRef.current.setSelectionRange(len, len)
    }
  }, [editing])

  const handleSave = async () => {
    const newValue = draft.trim() || null
    if (newValue === value) {
      setEditing(false)
      return
    }
    try {
      const updated = await updateTask(taskId, { description: newValue })
      onUpdated(updated)
      toast.success('説明を更新しました')
      setEditing(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '説明の更新に失敗しました')
      setDraft(value ?? '')
      setEditing(false)
    }
  }

  const handleCancel = () => {
    setDraft(value ?? '')
    setEditing(false)
  }

  if (!canEdit) {
    return value ? (
      <MarkdownPreview content={value} />
    ) : (
      <p className="text-sm text-foreground/40">説明はありません</p>
    )
  }

  if (editing) {
    return (
      <div className="space-y-2">
        <textarea
          ref={textareaRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className="w-full rounded-md border border-foreground/20 bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
          rows={8}
          maxLength={1000}
          placeholder="Markdown で記述できます"
        />
        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Check size={12} />
            保存
          </button>
          <button
            onClick={handleCancel}
            className="inline-flex items-center gap-1 rounded-md border border-foreground/20 px-3 py-1.5 text-xs font-medium text-foreground/60 hover:bg-foreground/5"
          >
            <X size={12} />
            キャンセル
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      className="group cursor-pointer"
      onClick={() => setEditing(true)}
      title="クリックして編集"
    >
      {value ? (
        <div className="relative">
          <MarkdownPreview content={value} />
          <Pencil size={14} className="absolute right-0 top-0 opacity-0 transition-opacity group-hover:opacity-40" />
        </div>
      ) : (
        <p className="text-sm text-foreground/40">
          クリックして説明を追加
          <Pencil size={12} className="ml-1 inline opacity-0 transition-opacity group-hover:opacity-40" />
        </p>
      )}
    </div>
  )
}

const InlineSelect = <T extends string>({
  value,
  options,
  config,
  taskId,
  fieldName,
  canEdit,
  onUpdated,
  label,
}: {
  value: T
  options: T[]
  config: Record<T, { label: string; className: string }>
  taskId: string
  fieldName: string
  canEdit: boolean
  onUpdated: (task: TaskData) => void
  label: string
}) => {
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  const handleSelect = async (newValue: T) => {
    if (newValue === value) {
      setOpen(false)
      return
    }
    setOpen(false)
    try {
      const updated = await updateTask(taskId, { [fieldName]: newValue })
      onUpdated(updated)
      toast.success(`${label}を更新しました`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : `${label}の更新に失敗しました`)
    }
  }

  const current = config[value]

  if (!canEdit) {
    return (
      <span className={`rounded-full px-3 py-1 text-xs font-medium ${current.className}`}>
        {current.label}
      </span>
    )
  }

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-colors hover:ring-1 hover:ring-foreground/20 ${current.className}`}
      >
        {current.label}
        <ChevronDown size={12} />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-40 rounded-md border border-foreground/10 bg-background py-1 shadow-lg">
          {options.map((opt) => {
            const cfg = config[opt]
            return (
              <button
                key={opt}
                onClick={() => handleSelect(opt)}
                className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs hover:bg-foreground/5 ${
                  opt === value ? 'font-medium' : ''
                }`}
              >
                <span className={`rounded-full px-2 py-0.5 ${cfg.className}`}>{cfg.label}</span>
                {opt === value && <Check size={12} className="ml-auto text-primary" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

const InlineSelectAssignee = ({
  value,
  members,
  taskId,
  canEdit,
  onUpdated,
}: {
  value: TaskMember | null
  members: ProjectMemberItem[]
  taskId: string
  canEdit: boolean
  onUpdated: (task: TaskData) => void
}) => {
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  const handleSelect = async (userId: string | null) => {
    const currentId = value?.id ?? null
    if (userId === currentId) {
      setOpen(false)
      return
    }
    setOpen(false)
    try {
      const updated = await updateTask(taskId, { assigneeId: userId })
      onUpdated(updated)
      toast.success('担当者を更新しました')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '担当者の更新に失敗しました')
    }
  }

  if (!canEdit) {
    return value ? (
      <div className="mt-2 flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/20 text-xs font-medium text-primary">
          {value.name.charAt(0).toUpperCase()}
        </div>
        <span className="text-sm text-foreground">{value.name}</span>
      </div>
    ) : (
      <p className="mt-2 text-sm text-foreground/40">未割り当て</p>
    )
  }

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="mt-2 flex w-full items-center gap-2 rounded-md p-1 transition-colors hover:bg-foreground/5"
      >
        {value ? (
          <>
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/20 text-xs font-medium text-primary">
              {value.name.charAt(0).toUpperCase()}
            </div>
            <span className="text-sm text-foreground">{value.name}</span>
          </>
        ) : (
          <span className="text-sm text-foreground/40">未割り当て</span>
        )}
        <ChevronDown size={12} className="ml-auto text-foreground/40" />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-full rounded-md border border-foreground/10 bg-background py-1 shadow-lg">
          <button
            onClick={() => handleSelect(null)}
            className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs hover:bg-foreground/5 ${
              !value ? 'font-medium' : ''
            }`}
          >
            <span className="text-foreground/40">未割り当て</span>
            {!value && <Check size={12} className="ml-auto text-primary" />}
          </button>
          {members.map((m) => (
            <button
              key={m.userId}
              onClick={() => handleSelect(m.userId)}
              className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs hover:bg-foreground/5 ${
                value?.id === m.userId ? 'font-medium' : ''
              }`}
            >
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 text-xs font-medium text-primary">
                {m.user.name.charAt(0).toUpperCase()}
              </div>
              <span className="text-foreground">{m.user.name}</span>
              {value?.id === m.userId && <Check size={12} className="ml-auto text-primary" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

const InlineDatePicker = ({
  value,
  taskId,
  canEdit,
  onUpdated,
}: {
  value: string | Date | null
  taskId: string
  canEdit: boolean
  onUpdated: (task: TaskData) => void
}) => {
  const dateValue = value ? new Date(value) : null
  const isOverdue = dateValue ? dateValue < new Date() : false
  const inputRef = useRef<HTMLInputElement>(null)

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value || null
    try {
      const updated = await updateTask(taskId, { dueDate: newValue })
      onUpdated(updated)
      toast.success('期限を更新しました')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '期限の更新に失敗しました')
    }
  }

  if (!canEdit) {
    return dateValue ? (
      <p className={`mt-2 text-sm ${isOverdue ? 'font-medium text-danger' : 'text-foreground'}`}>
        {format(dateValue, 'yyyy/MM/dd')}
        {isOverdue && <span className="ml-1 text-xs">(期限超過)</span>}
      </p>
    ) : (
      <p className="mt-2 text-sm text-foreground/40">未設定</p>
    )
  }

  return (
    <div className="mt-2">
      <input
        ref={inputRef}
        type="date"
        value={dateValue ? format(dateValue, 'yyyy-MM-dd') : ''}
        onChange={handleChange}
        className={`w-full rounded-md border border-foreground/20 bg-background px-2 py-1 text-sm outline-none focus:border-primary ${
          isOverdue ? 'text-danger' : 'text-foreground'
        }`}
      />
      {isOverdue && <span className="text-xs text-danger">(期限超過)</span>}
    </div>
  )
}

const InlineEditNumber = ({
  value,
  taskId,
  fieldName,
  label,
  canEdit,
  onUpdated,
}: {
  value: number | null
  taskId: string
  fieldName: string
  label: string
  canEdit: boolean
  onUpdated: (task: TaskData) => void
}) => {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value !== null ? String(value) : '')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editing])

  const handleSave = async () => {
    const num = draft.trim() === '' ? null : parseFloat(draft)
    if (num !== null && (isNaN(num) || num < 0)) {
      toast.error(`${label}は0以上の数値を入力してください`)
      setDraft(value !== null ? String(value) : '')
      setEditing(false)
      return
    }
    if (num === value) {
      setEditing(false)
      return
    }
    try {
      const updated = await updateTask(taskId, { [fieldName]: num })
      onUpdated(updated)
      toast.success(`${label}を更新しました`)
      setEditing(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : `${label}の更新に失敗しました`)
      setDraft(value !== null ? String(value) : '')
      setEditing(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave()
    if (e.key === 'Escape') {
      setDraft(value !== null ? String(value) : '')
      setEditing(false)
    }
  }

  if (!canEdit) {
    return value !== null ? (
      <p className="mt-2 text-sm text-foreground">{value} 時間</p>
    ) : (
      <p className="mt-2 text-sm text-foreground/40">未設定</p>
    )
  }

  if (editing) {
    return (
      <div className="mt-2">
        <div className="flex items-center gap-1">
          <input
            ref={inputRef}
            type="number"
            min="0"
            step="0.5"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleSave}
            className="w-24 rounded-md border border-foreground/20 bg-background px-2 py-1 text-sm text-foreground outline-none focus:border-primary"
          />
          <span className="text-sm text-foreground/60">時間</span>
        </div>
      </div>
    )
  }

  return (
    <div
      className="group mt-2 cursor-pointer"
      onClick={() => setEditing(true)}
      title="クリックして編集"
    >
      {value !== null ? (
        <p className="text-sm text-foreground">
          {value} 時間
          <Pencil size={12} className="ml-1 inline opacity-0 transition-opacity group-hover:opacity-40" />
        </p>
      ) : (
        <p className="text-sm text-foreground/40">
          未設定
          <Pencil size={12} className="ml-1 inline opacity-0 transition-opacity group-hover:opacity-40" />
        </p>
      )}
    </div>
  )
}

// --- Subtask Section ---

const SubtaskSection = ({
  task,
  canEdit,
  projectMembers,
  onUpdated,
}: {
  task: TaskData
  canEdit: boolean
  projectMembers: ProjectMemberItem[]
  onUpdated: (task: TaskData) => void
}) => {
  const [showForm, setShowForm] = useState(false)
  const [creating, setCreating] = useState(false)
  const [title, setTitle] = useState('')
  const [assigneeId, setAssigneeId] = useState('')
  const [dueDate, setDueDate] = useState('')
  const titleInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (showForm && titleInputRef.current) {
      titleInputRef.current.focus()
    }
  }, [showForm])

  const doneCount = task.subtasks.filter((s) => s.status === 'DONE').length
  const totalCount = task.subtasks.length
  const progressPercent = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0

  const handleCreate = async () => {
    const trimmed = title.trim()
    if (!trimmed || creating) return

    setCreating(true)
    try {
      const res = await fetch(`/api/tasks/${task.id}/subtasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: trimmed,
          assigneeId: assigneeId || undefined,
          dueDate: dueDate || undefined,
        }),
      })

      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error?.message ?? 'サブタスクの作成に失敗しました')
      }

      const json = await res.json()
      const newSubtask = json.data as TaskSubtask

      const refreshRes = await fetch(`/api/tasks/${task.id}`)
      if (refreshRes.ok) {
        const refreshJson = await refreshRes.json()
        onUpdated(refreshJson.data as TaskData)
      } else {
        onUpdated({
          ...task,
          subtasks: [...task.subtasks, newSubtask],
        })
      }

      toast.success('サブタスクを作成しました')
      setTitle('')
      setAssigneeId('')
      setDueDate('')
      setShowForm(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'サブタスクの作成に失敗しました')
    } finally {
      setCreating(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleCreate()
    }
    if (e.key === 'Escape') {
      setTitle('')
      setAssigneeId('')
      setDueDate('')
      setShowForm(false)
    }
  }

  return (
    <section className="rounded-lg border border-foreground/10 bg-background p-4">
      <div className="flex items-center gap-2">
        <ListTodo size={16} className="text-foreground/60" />
        <h2 className="text-sm font-semibold text-foreground">サブタスク</h2>
        {totalCount > 0 && (
          <span className="text-xs text-foreground/40">
            ({doneCount}/{totalCount})
          </span>
        )}
        {canEdit && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="ml-auto flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-primary hover:bg-primary/10"
          >
            <Plus size={14} />
            追加
          </button>
        )}
      </div>

      {/* Progress bar */}
      {totalCount > 0 && (
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs text-foreground/60">
            <span>進捗</span>
            <span>{progressPercent}%</span>
          </div>
          <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-foreground/10">
            <div
              className="h-full rounded-full bg-success transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Subtask list */}
      {totalCount > 0 ? (
        <ul className="mt-3 space-y-2">
          {task.subtasks.map((subtask) => {
            const subtaskStatus = statusConfig[subtask.status]
            const subtaskDueDate = subtask.dueDate ? new Date(subtask.dueDate) : null
            const isOverdue = subtaskDueDate && subtask.status !== 'DONE' ? subtaskDueDate < new Date() : false
            return (
              <li key={subtask.id}>
                <Link
                  href={`/projects/${task.projectId}/tasks/${subtask.id}`}
                  className="flex items-center gap-2 rounded-md p-2 text-sm hover:bg-foreground/5"
                >
                  <span className={`h-2 w-2 shrink-0 rounded-full ${subtask.status === 'DONE' ? 'bg-success' : 'bg-foreground/30'}`} />
                  <span className="text-xs text-foreground/40">
                    {task.project.key}-{subtask.taskNumber}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-foreground">{subtask.title}</span>
                  {subtaskDueDate && (
                    <span className={`flex shrink-0 items-center gap-1 text-xs ${isOverdue ? 'text-danger' : 'text-foreground/40'}`}>
                      <Calendar size={10} />
                      {format(subtaskDueDate, 'M/d')}
                    </span>
                  )}
                  {subtask.assignee && (
                    <div
                      className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-medium text-primary"
                      title={subtask.assignee.name}
                    >
                      {subtask.assignee.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${subtaskStatus.className}`}>
                    {subtaskStatus.label}
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      ) : (
        !showForm && <p className="mt-3 text-sm text-foreground/40">サブタスクはありません</p>
      )}

      {/* Create subtask form */}
      {showForm && (
        <div className="mt-3 space-y-3 rounded-md border border-foreground/10 bg-foreground/[0.02] p-3">
          <div>
            <input
              ref={titleInputRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="サブタスクのタイトル"
              className="w-full rounded-md border border-foreground/20 bg-background px-3 py-2 text-sm text-foreground placeholder:text-foreground/40 focus:border-primary focus:outline-none"
              maxLength={255}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-foreground/60">担当者</label>
              <select
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                className="w-full rounded-md border border-foreground/20 bg-background px-2 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none"
              >
                <option value="">未割り当て</option>
                {projectMembers.map((m) => (
                  <option key={m.userId} value={m.userId}>
                    {m.user.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-foreground/60">期限</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-md border border-foreground/20 bg-background px-2 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none"
              />
            </div>
          </div>
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => {
                setTitle('')
                setAssigneeId('')
                setDueDate('')
                setShowForm(false)
              }}
              className="rounded-md border border-foreground/20 px-3 py-1.5 text-xs font-medium text-foreground/60 hover:bg-foreground/5"
            >
              キャンセル
            </button>
            <button
              onClick={handleCreate}
              disabled={creating || !title.trim()}
              className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              {creating ? '作成中...' : '作成'}
            </button>
          </div>
        </div>
      )}
    </section>
  )
}

// --- Delete Confirmation Dialog ---

const DeleteConfirmDialog = ({
  taskKey,
  onConfirm,
  onCancel,
  isDeleting,
}: {
  taskKey: string
  onConfirm: () => void
  onCancel: () => void
  isDeleting: boolean
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onCancel} />
      <div className="relative z-50 w-full max-w-md rounded-lg border border-foreground/10 bg-background p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-foreground">タスクの削除</h3>
        <p className="mt-2 text-sm text-foreground/60">
          <span className="font-medium text-foreground">{taskKey}</span> を削除しますか？
        </p>
        <p className="mt-1 text-sm text-foreground/60">
          関連するコメント・添付ファイル・サブタスクもすべて削除されます。この操作は取り消せません。
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className="rounded-md border border-foreground/20 px-4 py-2 text-sm font-medium text-foreground/60 hover:bg-foreground/5 disabled:opacity-50"
          >
            キャンセル
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="rounded-md bg-danger px-4 py-2 text-sm font-medium text-white hover:bg-danger/90 disabled:opacity-50"
          >
            {isDeleting ? '削除中...' : '削除する'}
          </button>
        </div>
      </div>
    </div>
  )
}

interface CategoryItem {
  id: string
  name: string
  color: string
}

const InlineSelectCategories = ({
  taskCategories,
  taskId,
  projectId,
  canEdit,
  onUpdated,
}: {
  taskCategories: TaskCategory[]
  taskId: string
  projectId: string
  canEdit: boolean
  onUpdated: (task: TaskData) => void
}) => {
  const [open, setOpen] = useState(false)
  const [categories, setCategories] = useState<CategoryItem[]>([])
  const [optimisticIds, setOptimisticIds] = useState<string[] | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
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
  }, [open, projectId])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  const selectedIds = optimisticIds ?? taskCategories.map((tc) => tc.category.id)

  useEffect(() => {
    setOptimisticIds(null)
  }, [taskCategories])

  const handleToggle = async (categoryId: string) => {
    const currentIds = optimisticIds ?? taskCategories.map((tc) => tc.category.id)
    const newIds = currentIds.includes(categoryId)
      ? currentIds.filter((id) => id !== categoryId)
      : [...currentIds, categoryId]
    setOptimisticIds(newIds)
    try {
      const updated = await updateTask(taskId, { categoryIds: newIds })
      onUpdated(updated)
      toast.success('カテゴリを更新しました')
    } catch (error) {
      setOptimisticIds(null)
      toast.error(error instanceof Error ? error.message : 'カテゴリの更新に失敗しました')
    }
  }

  if (!canEdit) {
    return taskCategories.length > 0 ? (
      <div className="mt-2 flex flex-wrap gap-1">
        {taskCategories.map(({ category }) => (
          <span
            key={category.id}
            className="rounded-full px-2 py-0.5 text-xs font-medium"
            style={{
              backgroundColor: `color-mix(in oklch, ${category.color} 15%, transparent)`,
              color: category.color,
            }}
          >
            {category.name}
          </span>
        ))}
      </div>
    ) : (
      <p className="mt-2 text-sm text-foreground/40">未設定</p>
    )
  }

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="mt-2 flex w-full items-center gap-2 rounded-md p-1 transition-colors hover:bg-foreground/5"
      >
        {taskCategories.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {taskCategories.map(({ category }) => (
              <span
                key={category.id}
                className="rounded-full px-2 py-0.5 text-xs font-medium"
                style={{
                  backgroundColor: `color-mix(in oklch, ${category.color} 15%, transparent)`,
                  color: category.color,
                }}
              >
                {category.name}
              </span>
            ))}
          </div>
        ) : (
          <span className="text-sm text-foreground/40">未設定</span>
        )}
        <ChevronDown size={12} className="ml-auto shrink-0 text-foreground/40" />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-full rounded-md border border-foreground/10 bg-background py-1 shadow-lg">
          {categories.length === 0 ? (
            <p className="px-3 py-2 text-xs text-foreground/40">カテゴリがありません</p>
          ) : (
            categories.map((cat) => {
              const isSelected = selectedIds.includes(cat.id)
              return (
                <button
                  key={cat.id}
                  onClick={() => handleToggle(cat.id)}
                  className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs hover:bg-foreground/5 ${
                    isSelected ? 'font-medium' : ''
                  }`}
                >
                  <span
                    className="rounded-full px-2 py-0.5"
                    style={{
                      backgroundColor: `color-mix(in oklch, ${cat.color} 15%, transparent)`,
                      color: cat.color,
                    }}
                  >
                    {cat.name}
                  </span>
                  {isSelected && <Check size={12} className="ml-auto text-primary" />}
                </button>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}

// --- Main Component ---

export const TaskDetailClient = ({ task: initialTask, projectMembers, canEdit }: TaskDetailClientProps) => {
  const router = useRouter()
  const [task, setTask] = useState<TaskData>(initialTask)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleUpdated = (updatedTask: TaskData) => {
    setTask(updatedTask)
    router.refresh()
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/tasks/${task.id}`, { method: 'DELETE' })
      if (!res.ok && res.status !== 204) {
        const json = await res.json()
        throw new Error(json.error?.message ?? 'タスクの削除に失敗しました')
      }
      toast.success(`${task.project.key}-${task.taskNumber} を削除しました`)
      router.push(`/projects/${task.projectId}/board`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'タスクの削除に失敗しました')
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  const status = statusConfig[task.status]
  const priority = priorityConfig[task.priority]

  return (
    <div className="mx-auto max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <Link
          href={`/projects/${task.projectId}/board`}
          className="mb-4 inline-flex items-center gap-1 text-sm text-foreground/60 hover:text-foreground"
        >
          <ArrowLeft size={14} />
          <span>{task.project.name} に戻る</span>
        </Link>

        <div className="mt-2 flex items-start gap-3">
          <span className="mt-1 shrink-0 text-sm text-foreground/40">
            {task.project.key}-{task.taskNumber}
          </span>
          <InlineEditTitle
            value={task.title}
            taskId={task.id}
            canEdit={canEdit}
            onUpdated={handleUpdated}
          />
          {canEdit && (
            <button
              onClick={() => setShowDeleteDialog(true)}
              className="ml-auto mt-1 shrink-0 rounded-md p-1.5 text-foreground/40 transition-colors hover:bg-danger/10 hover:text-danger"
              title="タスクを削除"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <InlineSelect<TaskStatus>
            value={task.status}
            options={statusOptions}
            config={statusConfig}
            taskId={task.id}
            fieldName="status"
            canEdit={canEdit}
            onUpdated={handleUpdated}
            label="ステータス"
          />
          <InlineSelect<Priority>
            value={task.priority}
            options={priorityOptions}
            config={priorityConfig}
            taskId={task.id}
            fieldName="priority"
            canEdit={canEdit}
            onUpdated={handleUpdated}
            label="優先度"
          />
          {task.taskCategories.map(({ category }) => (
            <span
              key={category.id}
              className="rounded-full px-3 py-1 text-xs font-medium"
              style={{
                backgroundColor: `color-mix(in oklch, ${category.color} 15%, transparent)`,
                color: category.color,
              }}
            >
              {category.name}
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Description */}
          <section className="rounded-lg border border-foreground/10 bg-background p-4">
            <h2 className="mb-3 text-sm font-semibold text-foreground">説明</h2>
            <InlineEditDescription
              value={task.description}
              taskId={task.id}
              canEdit={canEdit}
              onUpdated={handleUpdated}
            />
          </section>

          {/* Subtasks */}
          <SubtaskSection
            task={task}
            canEdit={canEdit}
            projectMembers={projectMembers}
            onUpdated={handleUpdated}
          />

          {/* Comments placeholder */}
          <section className="rounded-lg border border-foreground/10 bg-background p-4">
            <div className="flex items-center gap-2">
              <MessageSquare size={16} className="text-foreground/60" />
              <h2 className="text-sm font-semibold text-foreground">コメント</h2>
            </div>
            <p className="mt-3 text-sm text-foreground/40">
              コメント機能は今後実装予定です
            </p>
          </section>

          {/* Activity placeholder */}
          <section className="rounded-lg border border-foreground/10 bg-background p-4">
            <div className="flex items-center gap-2">
              <Activity size={16} className="text-foreground/60" />
              <h2 className="text-sm font-semibold text-foreground">アクティビティ</h2>
            </div>
            <p className="mt-3 text-sm text-foreground/40">
              アクティビティ機能は今後実装予定です
            </p>
          </section>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Assignee */}
          <div className="rounded-lg border border-foreground/10 bg-background p-4">
            <div className="flex items-center gap-2 text-xs font-medium text-foreground/60">
              <User size={14} />
              <span>担当者</span>
            </div>
            <InlineSelectAssignee
              value={task.assignee}
              members={projectMembers}
              taskId={task.id}
              canEdit={canEdit}
              onUpdated={handleUpdated}
            />
          </div>

          {/* Reporter */}
          <div className="rounded-lg border border-foreground/10 bg-background p-4">
            <div className="flex items-center gap-2 text-xs font-medium text-foreground/60">
              <User size={14} />
              <span>起票者</span>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-foreground/10 text-xs font-medium text-foreground/60">
                {task.reporter.name.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm text-foreground">{task.reporter.name}</span>
            </div>
          </div>

          {/* Due date */}
          <div className="rounded-lg border border-foreground/10 bg-background p-4">
            <div className="flex items-center gap-2 text-xs font-medium text-foreground/60">
              <Calendar size={14} />
              <span>期限</span>
            </div>
            <InlineDatePicker
              value={task.dueDate}
              taskId={task.id}
              canEdit={canEdit}
              onUpdated={handleUpdated}
            />
          </div>

          {/* Estimated hours */}
          <div className="rounded-lg border border-foreground/10 bg-background p-4">
            <div className="flex items-center gap-2 text-xs font-medium text-foreground/60">
              <Clock size={14} />
              <span>見積もり工数</span>
            </div>
            <InlineEditNumber
              value={task.estimatedHours}
              taskId={task.id}
              fieldName="estimatedHours"
              label="見積もり工数"
              canEdit={canEdit}
              onUpdated={handleUpdated}
            />
          </div>

          {/* Actual hours */}
          <div className="rounded-lg border border-foreground/10 bg-background p-4">
            <div className="flex items-center gap-2 text-xs font-medium text-foreground/60">
              <Clock size={14} />
              <span>実績工数</span>
            </div>
            <InlineEditNumber
              value={task.actualHours}
              taskId={task.id}
              fieldName="actualHours"
              label="実績工数"
              canEdit={canEdit}
              onUpdated={handleUpdated}
            />
          </div>

          {/* Categories */}
          <div className="rounded-lg border border-foreground/10 bg-background p-4">
            <div className="flex items-center gap-2 text-xs font-medium text-foreground/60">
              <Tag size={14} />
              <span>カテゴリ</span>
            </div>
            <InlineSelectCategories
              taskCategories={task.taskCategories}
              taskId={task.id}
              projectId={task.projectId}
              canEdit={canEdit}
              onUpdated={handleUpdated}
            />
          </div>

          {/* Status (sidebar) */}
          <div className="rounded-lg border border-foreground/10 bg-background p-4">
            <div className="flex items-center gap-2 text-xs font-medium text-foreground/60">
              <Flag size={14} />
              <span>ステータス</span>
            </div>
            <div className="mt-2">
              <InlineSelect<TaskStatus>
                value={task.status}
                options={statusOptions}
                config={statusConfig}
                taskId={task.id}
                fieldName="status"
                canEdit={canEdit}
                onUpdated={handleUpdated}
                label="ステータス"
              />
            </div>
          </div>

          {/* Priority (sidebar) */}
          <div className="rounded-lg border border-foreground/10 bg-background p-4">
            <div className="flex items-center gap-2 text-xs font-medium text-foreground/60">
              <Flag size={14} />
              <span>優先度</span>
            </div>
            <div className="mt-2">
              <InlineSelect<Priority>
                value={task.priority}
                options={priorityOptions}
                config={priorityConfig}
                taskId={task.id}
                fieldName="priority"
                canEdit={canEdit}
                onUpdated={handleUpdated}
                label="優先度"
              />
            </div>
          </div>
        </div>
      </div>

      {showDeleteDialog && (
        <DeleteConfirmDialog
          taskKey={`${task.project.key}-${task.taskNumber}`}
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteDialog(false)}
          isDeleting={isDeleting}
        />
      )}
    </div>
  )
}
