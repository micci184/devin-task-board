'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { createProjectSchema, updateProjectSchema } from '@/lib/validations/project'

const generateProjectKey = (name: string): string => {
  const words = name.trim().split(/\s+/)
  if (words.length === 1) {
    return words[0].substring(0, 3).toUpperCase()
  }
  return words
    .map((w) => w.charAt(0))
    .join('')
    .toUpperCase()
    .substring(0, 5)
}

const ensureUniqueKey = async (baseKey: string): Promise<string> => {
  let key = baseKey
  let suffix = 1
  while (await prisma.project.findUnique({ where: { key } })) {
    key = `${baseKey}${suffix}`
    suffix++
  }
  return key
}

export interface ProjectActionState {
  error?: string
  success?: boolean
}

export const createProject = async (
  _prevState: ProjectActionState | null,
  formData: FormData,
): Promise<ProjectActionState> => {
  const session = await auth()
  if (!session?.user) {
    redirect('/login')
  }

  const raw = {
    name: formData.get('name'),
    description: formData.get('description') || undefined,
  }

  const parsed = createProjectSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const baseKey = generateProjectKey(parsed.data.name)
  const key = await ensureUniqueKey(baseKey)

  const project = await prisma.project.create({
    data: {
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      key,
      ownerId: session.user.id,
      projectMembers: {
        create: {
          userId: session.user.id,
          role: 'OWNER',
        },
      },
    },
  })

  revalidatePath('/projects')
  redirect(`/projects/${project.id}/board`)
}

export const updateProject = async (
  _prevState: ProjectActionState | null,
  formData: FormData,
): Promise<ProjectActionState> => {
  const session = await auth()
  if (!session?.user) {
    redirect('/login')
  }

  const projectId = formData.get('projectId') as string
  if (!projectId) {
    return { error: 'プロジェクトIDが必要です' }
  }

  const raw = {
    name: formData.get('name') || undefined,
    description: formData.get('description') ?? undefined,
  }

  const parsed = updateProjectSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
  })

  if (!project) {
    return { error: 'プロジェクトが見つかりません' }
  }

  if (project.ownerId !== session.user.id) {
    const member = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: { projectId, userId: session.user.id },
      },
    })
    if (!member || (member.role !== 'OWNER' && member.role !== 'ADMIN')) {
      return { error: 'プロジェクトの編集権限がありません' }
    }
  }

  await prisma.project.update({
    where: { id: projectId },
    data: {
      ...(parsed.data.name && { name: parsed.data.name }),
      ...(parsed.data.description !== undefined && {
        description: parsed.data.description ?? null,
      }),
    },
  })

  revalidatePath('/projects')
  revalidatePath(`/projects/${projectId}/settings`)
  return { success: true }
}

export const deleteProject = async (
  projectId: string,
): Promise<ProjectActionState> => {
  const session = await auth()
  if (!session?.user) {
    redirect('/login')
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
  })

  if (!project) {
    return { error: 'プロジェクトが見つかりません' }
  }

  if (project.ownerId !== session.user.id) {
    return { error: 'プロジェクトの削除はオーナーのみ可能です' }
  }

  await prisma.project.delete({
    where: { id: projectId },
  })

  revalidatePath('/projects')
  redirect('/projects')
}
