import { NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

import type { NextRequest } from 'next/server'

export const GET = async (
  _request: NextRequest,
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

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        project: { select: { id: true, name: true, key: true } },
        assignee: { select: { id: true, name: true, avatarUrl: true } },
        reporter: { select: { id: true, name: true, avatarUrl: true } },
        taskCategories: { include: { category: true } },
        subtasks: {
          select: {
            id: true,
            taskNumber: true,
            title: true,
            status: true,
            priority: true,
            assignee: { select: { id: true, name: true, avatarUrl: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    if (!task) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'タスクが見つかりません' } },
        { status: 404 },
      )
    }

    return NextResponse.json({ data: task })
  } catch (error) {
    console.error('[GET /api/tasks/[taskId]]', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'サーバーエラーが発生しました' } },
      { status: 500 },
    )
  }
}
