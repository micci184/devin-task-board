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
  URGENT: { label: '緊急', className: 'bg-danger/10 text-danger' },
  HIGH: { label: '高', className: 'bg-warning/10 text-warning' },
  MEDIUM: { label: '中', className: 'bg-primary/10 text-primary' },
  LOW: { label: '低', className: 'bg-success/10 text-success' },
  NONE: { label: 'なし', className: 'bg-foreground/10 text-foreground/60' },
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
