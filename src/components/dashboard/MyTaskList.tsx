import Link from 'next/link'
import { format } from 'date-fns'

type TaskItem = {
  id: string
  taskNumber: number
  title: string
  status: string
  priority: string
  dueDate: string | null
  projectId: string
  project: { key: string }
}

const PRIORITY_BADGE: Record<string, { label: string; className: string }> = {
  URGENT: { label: '緊急', className: 'bg-red-100 text-red-700' },
  HIGH: { label: '高', className: 'bg-orange-100 text-orange-700' },
  MEDIUM: { label: '中', className: 'bg-yellow-100 text-yellow-700' },
  LOW: { label: '低', className: 'bg-green-100 text-green-700' },
  NONE: { label: 'なし', className: 'bg-gray-100 text-gray-600' },
}

type Props = {
  tasks: TaskItem[]
  title: string
}

export const MyTaskList = ({ tasks, title }: Props) => (
  <div className="rounded-lg border border-foreground/10 bg-background p-5">
    <h3 className="mb-4 text-sm font-semibold text-foreground">{title}</h3>
    {tasks.length === 0 ? (
      <p className="text-sm text-foreground/40">タスクがありません</p>
    ) : (
      <ul className="space-y-3">
        {tasks.map((task) => {
          const badge = PRIORITY_BADGE[task.priority] ?? PRIORITY_BADGE.NONE
          return (
            <li key={task.id}>
              <Link
                href={`/projects/${task.projectId}/tasks/${task.id}`}
                className="flex items-center justify-between gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-foreground/5"
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="shrink-0 text-xs text-foreground/40">
                    {task.project.key}-{task.taskNumber}
                  </span>
                  <span className="truncate text-foreground">{task.title}</span>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span
                    className={`rounded px-1.5 py-0.5 text-xs font-medium ${badge.className}`}
                  >
                    {badge.label}
                  </span>
                  {task.dueDate && (
                    <span className="text-xs text-foreground/40">
                      {format(new Date(task.dueDate), 'M/d')}
                    </span>
                  )}
                </div>
              </Link>
            </li>
          )
        })}
      </ul>
    )}
  </div>
)
