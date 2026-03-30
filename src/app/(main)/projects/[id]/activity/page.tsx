import { redirect } from 'next/navigation'

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { ProjectActivityFeed } from '@/components/projects/ProjectActivityFeed'
import { ProjectNav } from '@/components/projects/ProjectNav'

interface ActivityPageProps {
  params: Promise<{ id: string }>
}

const ActivityPage = async ({ params }: ActivityPageProps) => {
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

  const member = await prisma.projectMember.findUnique({
    where: {
      projectId_userId: {
        projectId,
        userId: session.user.id,
      },
    },
  })

  if (!member) {
    redirect('/projects')
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{project.name}</h1>
          <p className="text-sm text-foreground/60">アクティビティフィード</p>
        </div>
      </div>

      <div className="mb-6">
        <ProjectNav projectId={projectId} />
      </div>

      <div className="rounded-lg border border-foreground/10 bg-background p-5">
        <ProjectActivityFeed projectId={projectId} />
      </div>
    </div>
  )
}
export default ActivityPage
