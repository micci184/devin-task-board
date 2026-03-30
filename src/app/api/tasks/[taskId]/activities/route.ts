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
      select: { id: true, projectId: true },
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

    const activities = await prisma.activityLog.findMany({
      where: {
        OR: [
          { entityType: 'task', entityId: taskId },
          { entityType: 'comment', newValue: { path: ['taskId'], equals: taskId } },
        ],
      },
      include: {
        user: { select: { id: true, name: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ data: activities })
  } catch (error) {
    console.error('[GET /api/tasks/[taskId]/activities]', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'サーバーエラーが発生しました' } },
      { status: 500 },
    )
  }
}
