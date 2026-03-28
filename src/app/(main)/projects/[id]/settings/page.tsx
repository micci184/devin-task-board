import { redirect } from 'next/navigation'

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { ProjectSettingsForm } from '@/components/projects/ProjectSettingsForm'
import { ProjectDeleteSection } from '@/components/projects/ProjectDeleteSection'

interface SettingsPageProps {
  params: Promise<{ id: string }>
}

const SettingsPage = async ({ params }: SettingsPageProps) => {
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

  const isOwner = project.ownerId === session.user.id

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">プロジェクト設定</h1>
        <p className="text-sm text-foreground/60">{project.name} の設定</p>
      </div>

      <div className="space-y-8">
        <ProjectSettingsForm
          projectId={project.id}
          defaultName={project.name}
          defaultDescription={project.description ?? ''}
        />

        {isOwner && <ProjectDeleteSection projectId={project.id} projectName={project.name} />}
      </div>
    </div>
  )
}
export default SettingsPage
