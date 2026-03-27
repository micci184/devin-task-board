import { NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { createTaskSchema } from '@/lib/validations/task'

import type { NextRequest } from 'next/server'

export const GET = async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: '認証が必要です' } },
        { status: 401 },
      )
    }

    const { id: projectId } = await params

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    })
    if (!project) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'プロジェクトが見つかりません' } },
        { status: 404 },
      )
    }

    const tasks = await prisma.task.findMany({
      where: { projectId },
      include: {
        assignee: { select: { id: true, name: true, avatarUrl: true } },
        reporter: { select: { id: true, name: true, avatarUrl: true } },
        taskCategories: { include: { category: true } },
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    })

    return NextResponse.json({ data: tasks })
  } catch (error) {
    console.error('[GET /api/projects/[id]/tasks]', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'サーバーエラーが発生しました' } },
      { status: 500 },
    )
  }
}

export const POST = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: '認証が必要です' } },
        { status: 401 },
      )
    }

    const { id: projectId } = await params

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    })
    if (!project) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'プロジェクトが見つかりません' } },
        { status: 404 },
      )
    }

    const body = await request.json()
    const parsed = createTaskSchema.safeParse(body)

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

    const task = await prisma.$transaction(async (tx) => {
      const lastTask = await tx.task.findFirst({
        where: { projectId },
        orderBy: { taskNumber: 'desc' },
        select: { taskNumber: true },
      })
      const taskNumber = (lastTask?.taskNumber ?? 0) + 1

      const { categoryIds, ...rest } = parsed.data

      const created = await tx.task.create({
        data: {
          title: rest.title,
          description: rest.description,
          priority: rest.priority,
          status: rest.status,
          assigneeId: rest.assigneeId || null,
          dueDate: rest.dueDate ? new Date(rest.dueDate) : null,
          projectId,
          reporterId: session.user.id,
          taskNumber,
          ...(categoryIds && categoryIds.length > 0
            ? {
                taskCategories: {
                  create: categoryIds.map((categoryId) => ({ categoryId })),
                },
              }
            : {}),
        },
        include: {
          assignee: { select: { id: true, name: true, avatarUrl: true } },
          reporter: { select: { id: true, name: true, avatarUrl: true } },
          taskCategories: { include: { category: true } },
        },
      })

      return created
    })

    return NextResponse.json({ data: task }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/projects/[id]/tasks]', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'サーバーエラーが発生しました' } },
      { status: 500 },
    )
  }
}
