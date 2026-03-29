import { redirect } from 'next/navigation'

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { TaskListView } from '@/components/tasks/TaskListView'

interface ListPageProps {
  params: Promise<{ id: string }>
}

const ListPage = async ({ params }: ListPageProps) => {
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

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{project.name}</h1>
          <p className="text-sm text-foreground/60">リストビュー</p>
        </div>
      </div>

      <TaskListView projectId={projectId} projectKey={project.key} />
    </div>
  )
}
export default ListPage
