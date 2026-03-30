import Link from 'next/link'
import { format } from 'date-fns'
import { getTranslations } from 'next-intl/server'

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

const PRIORITY_CLASSNAME: Record<string, string> = {
  URGENT: 'bg-danger/10 text-danger',
  HIGH: 'bg-warning/10 text-warning',
  MEDIUM: 'bg-primary/10 text-primary',
  LOW: 'bg-success/10 text-success',
  NONE: 'bg-foreground/10 text-foreground/60',
}

type Props = {
  tasks: TaskItem[]
  title: string
}

export const MyTaskList = async ({ tasks, title }: Props) => {
  const t = await getTranslations('tasks')
  const tDashboard = await getTranslations('dashboard')

  return (
    <div className="rounded-lg border border-foreground/10 bg-background p-5">
      <h3 className="mb-4 text-sm font-semibold text-foreground">{title}</h3>
      {tasks.length === 0 ? (
        <p className="text-sm text-foreground/40">{tDashboard('noTasks')}</p>
      ) : (
        <ul className="space-y-3">
          {tasks.map((task) => {
            const className = PRIORITY_CLASSNAME[task.priority] ?? PRIORITY_CLASSNAME.NONE
            const priorityLabel = t(`priority.${task.priority}` as 'priority.URGENT' | 'priority.HIGH' | 'priority.MEDIUM' | 'priority.LOW' | 'priority.NONE')
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
                      className={`rounded px-1.5 py-0.5 text-xs font-medium ${className}`}
                    >
                      {priorityLabel}
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
}
