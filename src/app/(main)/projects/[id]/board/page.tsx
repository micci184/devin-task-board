import { redirect } from 'next/navigation'

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { KanbanBoard } from '@/components/board/KanbanBoard'

interface BoardPageProps {
  params: Promise<{ id: string }>
}

const BoardPage = async ({ params }: BoardPageProps) => {
  const session = await auth()
  if (!session?.user) {
    redirect('/login')
  }

  const { id: projectId } = await params

  const project = await prisma.project.findUnique({
    where: { id: projectId },
  })

  if (!project) {
    redirect('/projects')
  }

  const [tasks, categories] = await Promise.all([
    prisma.task.findMany({
      where: { projectId },
      include: {
        assignee: { select: { id: true, name: true, avatarUrl: true } },
        reporter: { select: { id: true, name: true, avatarUrl: true } },
        taskCategories: { include: { category: true } },
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    }),
    prisma.category.findMany({
      where: { projectId },
      orderBy: { name: 'asc' },
    }),
  ])

  const serializedTasks = tasks.map((task) => ({
    ...task,
    dueDate: task.dueDate?.toISOString() ?? null,
    startDate: task.startDate?.toISOString() ?? null,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
  }))

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{project.name}</h1>
          <p className="text-sm text-foreground/60">カンバンボード</p>
        </div>
      </div>

      <KanbanBoard
        tasks={serializedTasks}
        projectId={projectId}
        projectKey={project.key}
        categories={categories}
      />
    </div>
  )
}
export default BoardPage
