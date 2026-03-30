import { redirect } from 'next/navigation'

import { getTranslations } from 'next-intl/server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { GanttChart } from '@/components/gantt/GanttChart'

interface GanttPageProps {
  params: Promise<{ id: string }>
}

const GanttPage = async ({ params }: GanttPageProps) => {
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

  const [tasks, categories, members] = await Promise.all([
    prisma.task.findMany({
      where: { projectId },
      include: {
        assignee: { select: { id: true, name: true, avatarUrl: true } },
        taskCategories: { include: { category: true } },
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    }),
    prisma.category.findMany({
      where: { projectId },
      orderBy: { name: 'asc' },
    }),
    prisma.projectMember.findMany({
      where: { projectId },
      include: { user: { select: { id: true, name: true } } },
    }),
  ])

  const serializedTasks = tasks.map((task) => ({
    ...task,
    dueDate: task.dueDate?.toISOString() ?? null,
    startDate: task.startDate?.toISOString() ?? null,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
  }))

  const memberList = members.map((m) => ({ id: m.user.id, name: m.user.name }))

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{project.name}</h1>
          <p className="text-sm text-foreground/60">{(await getTranslations('projects'))('ganttChart')}</p>
        </div>
      </div>

      <GanttChart
        tasks={serializedTasks}
        projectId={projectId}
        projectKey={project.key}
        categories={categories}
        members={memberList}
      />
    </div>
  )
}
export default GanttPage
