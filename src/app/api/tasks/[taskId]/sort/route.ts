import { NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { updateTaskSortSchema } from '@/lib/validations/task'

import type { NextRequest } from 'next/server'

export const PATCH = async (
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> },
) => {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: '認証が必要です' } },
        { status: 401 },
      )
    }

    const { taskId } = await params
    const body = await request.json()
    const parsed = updateTaskSortSchema.safeParse(body)

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

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { id: true, sortOrder: true, status: true, projectId: true },
    })

    if (!task) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'タスクが見つかりません' } },
        { status: 404 },
      )
    }

    const member = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId: task.projectId,
          userId: session.user.id,
        },
      },
    })

    if (!member) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'このプロジェクトへのアクセス権がありません' } },
        { status: 403 },
      )
    }

    if (member.role === 'VIEWER') {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: '閲覧者は並び順を変更できません' } },
        { status: 403 },
      )
    }

    const { sortOrder, status } = parsed.data

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        sortOrder,
        ...(status !== undefined ? { status } : {}),
      },
    })

    return NextResponse.json({ data: updatedTask })
  } catch (error) {
    console.error('[PATCH /api/tasks/[taskId]/sort]', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'サーバーエラーが発生しました' } },
      { status: 500 },
    )
  }
}
