import { redirect } from 'next/navigation'
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
} from 'lucide-react'
import { format } from 'date-fns'

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { MarkdownPreview } from '@/components/tasks/MarkdownPreview'

import type { Priority, TaskStatus } from '@prisma/client'

interface TaskDetailPageProps {
  params: Promise<{ id: string; taskId: string }>
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

const TaskDetailPage = async ({ params }: TaskDetailPageProps) => {
  const session = await auth()
  if (!session?.user) {
    redirect('/login')
  }

  const { id: projectId, taskId } = await params

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      project: { select: { id: true, name: true, key: true } },
      assignee: { select: { id: true, name: true, avatarUrl: true } },
      reporter: { select: { id: true, name: true, avatarUrl: true } },
      taskCategories: { include: { category: true } },
      subtasks: {
        select: {
          id: true,
          taskNumber: true,
          title: true,
          status: true,
          priority: true,
          assignee: { select: { id: true, name: true, avatarUrl: true } },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  })

  if (!task || task.projectId !== projectId) {
    redirect(`/projects/${projectId}/board`)
  }

  const status = statusConfig[task.status]
  const priority = priorityConfig[task.priority]
  const dueDate = task.dueDate ? new Date(task.dueDate) : null
  const isOverdue = dueDate ? dueDate < new Date() : false

  return (
    <div className="mx-auto max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <Link
          href={`/projects/${projectId}/board`}
          className="mb-4 inline-flex items-center gap-1 text-sm text-foreground/60 hover:text-foreground"
        >
          <ArrowLeft size={14} />
          <span>{task.project.name} に戻る</span>
        </Link>

        <div className="mt-2 flex items-start gap-3">
          <span className="mt-1 shrink-0 text-sm text-foreground/40">
            {task.project.key}-{task.taskNumber}
          </span>
          <h1 className="text-2xl font-bold text-foreground">{task.title}</h1>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className={`rounded-full px-3 py-1 text-xs font-medium ${status.className}`}>
            {status.label}
          </span>
          <span className={`rounded-full px-3 py-1 text-xs font-medium ${priority.className}`}>
            {priority.label}
          </span>
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
            {task.description ? (
              <MarkdownPreview content={task.description} />
            ) : (
              <p className="text-sm text-foreground/40">説明はありません</p>
            )}
          </section>

          {/* Subtasks placeholder */}
          <section className="rounded-lg border border-foreground/10 bg-background p-4">
            <div className="flex items-center gap-2">
              <ListTodo size={16} className="text-foreground/60" />
              <h2 className="text-sm font-semibold text-foreground">サブタスク</h2>
              {task.subtasks.length > 0 && (
                <span className="text-xs text-foreground/40">({task.subtasks.length})</span>
              )}
            </div>
            {task.subtasks.length > 0 ? (
              <ul className="mt-3 space-y-2">
                {task.subtasks.map((subtask) => {
                  const subtaskStatus = statusConfig[subtask.status]
                  return (
                    <li key={subtask.id}>
                      <Link
                        href={`/projects/${projectId}/tasks/${subtask.id}`}
                        className="flex items-center gap-2 rounded-md p-2 text-sm hover:bg-foreground/5"
                      >
                        <span className={`h-2 w-2 shrink-0 rounded-full ${subtask.status === 'DONE' ? 'bg-success' : 'bg-foreground/30'}`} />
                        <span className="text-xs text-foreground/40">
                          {task.project.key}-{subtask.taskNumber}
                        </span>
                        <span className="text-foreground">{subtask.title}</span>
                        <span className={`ml-auto rounded-full px-2 py-0.5 text-xs ${subtaskStatus.className}`}>
                          {subtaskStatus.label}
                        </span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-foreground/40">サブタスクはありません</p>
            )}
          </section>

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
            {task.assignee ? (
              <div className="mt-2 flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/20 text-xs font-medium text-primary">
                  {task.assignee.name.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm text-foreground">{task.assignee.name}</span>
              </div>
            ) : (
              <p className="mt-2 text-sm text-foreground/40">未割り当て</p>
            )}
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
            {dueDate ? (
              <p className={`mt-2 text-sm ${isOverdue ? 'font-medium text-danger' : 'text-foreground'}`}>
                {format(dueDate, 'yyyy/MM/dd')}
                {isOverdue && <span className="ml-1 text-xs">(期限超過)</span>}
              </p>
            ) : (
              <p className="mt-2 text-sm text-foreground/40">未設定</p>
            )}
          </div>

          {/* Estimated hours */}
          <div className="rounded-lg border border-foreground/10 bg-background p-4">
            <div className="flex items-center gap-2 text-xs font-medium text-foreground/60">
              <Clock size={14} />
              <span>見積もり工数</span>
            </div>
            {task.estimatedHours !== null ? (
              <p className="mt-2 text-sm text-foreground">{task.estimatedHours} 時間</p>
            ) : (
              <p className="mt-2 text-sm text-foreground/40">未設定</p>
            )}
          </div>

          {/* Categories */}
          {task.taskCategories.length > 0 && (
            <div className="rounded-lg border border-foreground/10 bg-background p-4">
              <div className="flex items-center gap-2 text-xs font-medium text-foreground/60">
                <Tag size={14} />
                <span>カテゴリ</span>
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {task.taskCategories.map(({ category }) => (
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
            </div>
          )}

          {/* Status */}
          <div className="rounded-lg border border-foreground/10 bg-background p-4">
            <div className="flex items-center gap-2 text-xs font-medium text-foreground/60">
              <Flag size={14} />
              <span>ステータス</span>
            </div>
            <div className="mt-2">
              <span className={`rounded-full px-3 py-1 text-xs font-medium ${status.className}`}>
                {status.label}
              </span>
            </div>
          </div>

          {/* Priority */}
          <div className="rounded-lg border border-foreground/10 bg-background p-4">
            <div className="flex items-center gap-2 text-xs font-medium text-foreground/60">
              <Flag size={14} />
              <span>優先度</span>
            </div>
            <div className="mt-2">
              <span className={`rounded-full px-3 py-1 text-xs font-medium ${priority.className}`}>
                {priority.label}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
export default TaskDetailPage
