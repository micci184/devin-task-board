import { redirect } from 'next/navigation'

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { TaskDetailClient } from '@/components/tasks/TaskDetailClient'

interface TaskDetailPageProps {
  params: Promise<{ id: string; taskId: string }>
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
          dueDate: true,
          assignee: { select: { id: true, name: true, avatarUrl: true } },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  })

  if (!task || task.projectId !== projectId) {
    redirect(`/projects/${projectId}/board`)
  }

  const member = await prisma.projectMember.findUnique({
    where: {
      projectId_userId: {
        projectId,
        userId: session.user.id,
      },
    },
  })

  const canEdit = !!member && member.role !== 'VIEWER'

  const projectMembers = await prisma.projectMember.findMany({
    where: { projectId },
    select: {
      id: true,
      userId: true,
      user: { select: { id: true, name: true, avatarUrl: true } },
    },
  })

  const serializedTask = {
    ...task,
    dueDate: task.dueDate ? task.dueDate.toISOString() : null,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
    subtasks: task.subtasks.map((s) => ({
      ...s,
      dueDate: s.dueDate ? s.dueDate.toISOString() : null,
    })),
  }

  return (
    <TaskDetailClient
      task={serializedTask}
      projectMembers={projectMembers}
      canEdit={canEdit}
    />
  )
}
export default TaskDetailPage
