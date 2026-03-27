'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

import { X } from 'lucide-react'

import { createTaskSchema } from '@/lib/validations/task'

import type { CreateTaskInput } from '@/lib/validations/task'
import type { TaskStatus } from '@prisma/client'

interface TaskCreateModalProps {
  projectId: string
  defaultStatus: TaskStatus
  onClose: () => void
}

export const TaskCreateModal = ({
  projectId,
  defaultStatus,
  onClose,
}: TaskCreateModalProps) => {
  const router = useRouter()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof CreateTaskInput, string>>>({})

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setFieldErrors({})

    const formData = new FormData(e.currentTarget)
    const data = {
      title: formData.get('title') as string,
      description: (formData.get('description') as string) || undefined,
      priority: formData.get('priority') as string,
      status: defaultStatus,
      dueDate: (formData.get('dueDate') as string) || undefined,
    }

    const parsed = createTaskSchema.safeParse(data)
    if (!parsed.success) {
      const errors: Partial<Record<keyof CreateTaskInput, string>> = {}
      for (const issue of parsed.error.issues) {
        const field = issue.path[0] as keyof CreateTaskInput
        if (!errors[field]) errors[field] = issue.message
      }
      setFieldErrors(errors)
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
      })

      const json = await res.json()

      if (!res.ok) {
        setError(json.error?.message ?? 'タスクの作成に失敗しました')
        return
      }

      router.refresh()
      onClose()
    } catch {
      setError('タスクの作成中にエラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20">
      <div className="w-full max-w-lg rounded-lg border border-foreground/10 bg-background p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">タスクを作成</h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-md text-foreground/60 hover:bg-foreground/5 hover:text-foreground"
            aria-label="閉じる"
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-md bg-danger/10 p-3 text-sm text-danger">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="title" className="mb-1 block text-sm font-medium text-foreground">
              タイトル <span className="text-danger">*</span>
            </label>
            <input
              id="title"
              name="title"
              type="text"
              className="w-full rounded-md border border-foreground/20 bg-background px-3 py-2 text-sm text-foreground placeholder:text-foreground/40 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="タスクのタイトル"
            />
            {fieldErrors.title && (
              <p className="mt-1 text-sm text-danger">{fieldErrors.title}</p>
            )}
          </div>

          <div>
            <label htmlFor="description" className="mb-1 block text-sm font-medium text-foreground">
              説明
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              className="w-full rounded-md border border-foreground/20 bg-background px-3 py-2 text-sm text-foreground placeholder:text-foreground/40 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="タスクの説明（Markdown対応）"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="priority" className="mb-1 block text-sm font-medium text-foreground">
                優先度
              </label>
              <select
                id="priority"
                name="priority"
                defaultValue="NONE"
                className="w-full rounded-md border border-foreground/20 bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="NONE">なし</option>
                <option value="LOW">低</option>
                <option value="MEDIUM">中</option>
                <option value="HIGH">高</option>
                <option value="URGENT">緊急</option>
              </select>
            </div>

            <div>
              <label htmlFor="dueDate" className="mb-1 block text-sm font-medium text-foreground">
                期限
              </label>
              <input
                id="dueDate"
                name="dueDate"
                type="date"
                className="w-full rounded-md border border-foreground/20 bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-foreground/20 px-4 py-2 text-sm font-medium text-foreground hover:bg-foreground/5"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              {loading ? '作成中...' : '作成'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
