import { redirect } from 'next/navigation'

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { InviteMemberForm } from '@/components/members/InviteMemberForm'
import { MemberList } from '@/components/members/MemberList'

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

  const [project, membership, members] = await Promise.all([
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
  ])

  if (!project || !membership) {
    redirect('/projects')
  }

  const canInvite = membership.role === 'OWNER' || membership.role === 'ADMIN'

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
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">{project.name}</h1>
        <p className="text-sm text-foreground/60">プロジェクト設定</p>
      </div>

      <div className="space-y-8">
        <section>
          <h2 className="mb-4 text-lg font-semibold text-foreground">
            メンバー（{members.length}人）
          </h2>

          {canInvite && (
            <div className="mb-6 rounded-lg border border-foreground/10 bg-foreground/[0.02] p-4">
              <h3 className="mb-3 text-sm font-medium text-foreground">メンバーを招待</h3>
              <InviteMemberForm projectId={projectId} />
            </div>
          )}

          <MemberList members={serializedMembers} />
        </section>
      </div>
    </div>
  )
}
export default SettingsPage
