import { redirect } from 'next/navigation'

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { ProjectSettingsForm } from '@/components/projects/ProjectSettingsForm'
import { ProjectDeleteSection } from '@/components/projects/ProjectDeleteSection'
import { InviteMemberForm } from '@/components/members/InviteMemberForm'
import { MemberList } from '@/components/members/MemberList'
import { CategoryForm } from '@/components/categories/CategoryForm'
import { CategoryList } from '@/components/categories/CategoryList'

import type { ProjectRole } from '@prisma/client'

interface SettingsPageProps {
  params: Promise<{ id: string }>
}

const SettingsPage = async ({ params }: SettingsPageProps) => {
  const session = await auth()
  if (!session?.user) {
    redirect('/login')
  }

  const { id: projectId } = await params

  const [project, membership, members, categories] = await Promise.all([
    prisma.project.findUnique({
      where: { id: projectId },
    }),
    prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId: session.user.id } },
    }),
    prisma.projectMember.findMany({
      where: { projectId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.category.findMany({
      where: { projectId },
      orderBy: { createdAt: 'asc' },
    }),
  ])

  if (!project || !membership) {
    redirect('/projects')
  }

  if (membership.role === 'VIEWER') {
    redirect('/projects')
  }

  const isOwner = project.ownerId === session.user.id
  const isAdmin = membership.role === 'OWNER' || membership.role === 'ADMIN'
  const canManageCategories = true

  const serializedMembers = members.map((m) => ({
    id: m.id,
    projectId: m.projectId,
    userId: m.userId,
    role: m.role as ProjectRole,
    createdAt: m.createdAt.toISOString(),
    updatedAt: m.updatedAt.toISOString(),
    user: {
      id: m.user.id,
      email: m.user.email,
      name: m.user.name,
      avatarUrl: m.user.avatarUrl,
    },
  }))

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">プロジェクト設定</h1>
        <p className="text-sm text-foreground/60">{project.name} の設定</p>
      </div>

      <div className="space-y-8">
        {isAdmin && (
          <ProjectSettingsForm
            projectId={project.id}
            defaultName={project.name}
            defaultDescription={project.description ?? ''}
          />
        )}

        {isAdmin && (
          <section>
            <h2 className="mb-4 text-lg font-semibold text-foreground">
              メンバー（{members.length}人）
            </h2>

            <div className="mb-6 rounded-lg border border-foreground/10 bg-foreground/[0.02] p-4">
              <h3 className="mb-3 text-sm font-medium text-foreground">メンバーを招待</h3>
              <InviteMemberForm projectId={projectId} />
            </div>

            <MemberList
              members={serializedMembers}
              currentUserId={session.user.id}
              currentUserRole={membership.role}
            />
          </section>
        )}

        <section>
          <h2 className="mb-4 text-lg font-semibold text-foreground">
            カテゴリ（{categories.length}件）
          </h2>

          {canManageCategories && (
            <div className="mb-6 rounded-lg border border-foreground/10 bg-foreground/[0.02] p-4">
              <h3 className="mb-3 text-sm font-medium text-foreground">カテゴリを追加</h3>
              <CategoryForm projectId={projectId} />
            </div>
          )}

          <CategoryList
            categories={categories.map((c) => ({
              id: c.id,
              name: c.name,
              color: c.color,
              projectId: c.projectId,
              createdAt: c.createdAt.toISOString(),
              updatedAt: c.updatedAt.toISOString(),
            }))}
            canManage={canManageCategories}
          />
        </section>

        {isOwner && isAdmin && <ProjectDeleteSection projectId={project.id} projectName={project.name} />}
      </div>
    </div>
  )
}
export default SettingsPage
