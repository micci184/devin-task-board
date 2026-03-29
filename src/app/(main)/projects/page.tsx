import Link from 'next/link'
import { redirect } from 'next/navigation'

import { FolderKanban, Plus, Users, ListTodo } from 'lucide-react'

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

const ProjectsPage = async () => {
  const session = await auth()
  if (!session?.user) {
    redirect('/login')
  }

  const projects = await prisma.project.findMany({
    where: {
      projectMembers: {
        some: { userId: session.user.id },
      },
    },
    include: {
      _count: {
        select: {
          tasks: true,
          projectMembers: true,
        },
      },
    },
    orderBy: { updatedAt: 'desc' },
  })

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">プロジェクト</h1>
          <p className="text-sm text-foreground/60">
            参加中のプロジェクト一覧
          </p>
        </div>
        <Link
          href="/projects/new"
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Plus size={16} />
          新規プロジェクト
        </Link>
      </div>

      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-foreground/10 py-16">
          <FolderKanban size={48} className="text-foreground/20" />
          <p className="mt-4 text-sm text-foreground/60">
            プロジェクトがありません
          </p>
          <Link
            href="/projects/new"
            className="mt-4 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Plus size={16} />
            最初のプロジェクトを作成
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/projects/${project.id}/board`}
              className="group rounded-lg border border-foreground/10 p-5 transition-colors hover:border-primary/30 hover:bg-foreground/[0.02]"
            >
              <div className="mb-3 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-sm font-bold text-primary">
                    {project.key}
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-foreground group-hover:text-primary">
                      {project.name}
                    </h2>
                    {project.description && (
                      <p className="mt-0.5 line-clamp-1 text-xs text-foreground/50">
                        {project.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs text-foreground/50">
                <span className="inline-flex items-center gap-1">
                  <ListTodo size={14} />
                  {project._count.tasks} タスク
                </span>
                <span className="inline-flex items-center gap-1">
                  <Users size={14} />
                  {project._count.projectMembers} メンバー
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
export default ProjectsPage
