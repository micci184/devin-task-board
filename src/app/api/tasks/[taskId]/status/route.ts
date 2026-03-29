import { NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { updateTaskStatusSchema } from '@/lib/validations/task'
import { notifyTaskStatusChanged } from '@/lib/notifications'

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
    const parsed = updateTaskStatusSchema.safeParse(body)

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
      select: {
        id: true,
        status: true,
        projectId: true,
        assigneeId: true,
        reporterId: true,
        taskNumber: true,
        project: { select: { key: true } },
      },
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
        { error: { code: 'FORBIDDEN', message: '閲覧者はステータスを変更できません' } },
        { status: 403 },
      )
    }

    const oldStatus = task.status
    const newStatus = parsed.data.status

    const updatedTask = await prisma.$transaction(async (tx) => {
      const updated = await tx.task.update({
        where: { id: taskId },
        data: {
          status: newStatus,
          ...(parsed.data.sortOrder !== undefined
            ? { sortOrder: parsed.data.sortOrder }
            : {}),
        },
      })

      await tx.activityLog.create({
        data: {
          action: 'STATUS_CHANGED',
          entityType: 'task',
          entityId: taskId,
          userId: session.user.id,
          projectId: task.projectId,
          oldValue: { status: oldStatus },
          newValue: { status: newStatus },
        },
      })

      // 通知トリガー: ステータス変更
      if (oldStatus !== newStatus) {
        const taskKey = `${task.project.key}-${task.taskNumber}`
        await notifyTaskStatusChanged(tx, {
          changerUserId: session.user.id,
          changerName: session.user.name ?? '',
          taskKey,
          taskId,
          projectId: task.projectId,
          assigneeId: task.assigneeId,
          reporterId: task.reporterId,
          oldStatus,
          newStatus,
        })
      }

      return updated
    })

    return NextResponse.json({ data: updatedTask })
  } catch (error) {
    console.error('[PATCH /api/tasks/[taskId]/status]', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'サーバーエラーが発生しました' } },
      { status: 500 },
    )
  }
}
