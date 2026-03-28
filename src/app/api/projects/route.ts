import { NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { createProjectSchema } from '@/lib/validations/project'

import type { NextRequest } from 'next/server'

const generateProjectKey = (name: string): string => {
  const words = name.trim().split(/\s+/)
  if (words.length === 1) {
    return words[0].slice(0, 3).toUpperCase()
  }
  return words
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 5)
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

export const GET = async (_request: NextRequest) => {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: '認証が必要です' } },
        { status: 401 },
      )
    }

    const memberships = await prisma.projectMember.findMany({
      where: { userId: session.user.id },
      select: { projectId: true },
    })
    const projectIds = memberships.map((m) => m.projectId)

    const projects = await prisma.project.findMany({
      where: { id: { in: projectIds } },
      include: {
        _count: {
          select: {
            tasks: true,
            projectMembers: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const data = projects.map(({ _count, ...project }) => ({
      ...project,
      taskCount: _count.tasks,
      memberCount: _count.projectMembers,
    }))

    return NextResponse.json({ data })
  } catch (error) {
    console.error('[GET /api/projects]', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'サーバーエラーが発生しました' } },
      { status: 500 },
    )
  }
}

export const POST = async (request: NextRequest) => {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: '認証が必要です' } },
        { status: 401 },
      )
    }

    const body = await request.json()
    const parsed = createProjectSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: parsed.error.issues[0].message,
          },
        },
        { status: 400 },
      )
    }

    const baseKey = generateProjectKey(parsed.data.name)
    const key = await ensureUniqueKey(baseKey)

    const project = await prisma.$transaction(async (tx) => {
      const created = await tx.project.create({
        data: {
          name: parsed.data.name,
          description: parsed.data.description ?? null,
          key,
          ownerId: session.user.id,
        },
      })

      await tx.projectMember.create({
        data: {
          projectId: created.id,
          userId: session.user.id,
          role: 'OWNER',
        },
      })

      return created
    })

    return NextResponse.json({ data: project }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/projects]', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'サーバーエラーが発生しました' } },
      { status: 500 },
    )
  }
}
