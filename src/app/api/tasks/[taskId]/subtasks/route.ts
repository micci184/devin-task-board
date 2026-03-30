import { NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { createSubtaskSchema } from '@/lib/validations/task'
import { notifyTaskAssigned } from '@/lib/notifications'

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

    const parentTask = await prisma.task.findUnique({
      where: { id: taskId },
      select: {
        id: true,
        projectId: true,
        project: { select: { key: true } },
      },
    })

    if (!parentTask) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: '親タスクが見つかりません' } },
        { status: 404 },
      )
    }

    const subtasks = await prisma.task.findMany({
      where: { parentTaskId: taskId },
      select: {
        id: true,
        taskNumber: true,
        title: true,
        status: true,
        priority: true,
        dueDate: true,
        assignee: { select: { id: true, name: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json({ data: subtasks })
  } catch (error) {
    console.error('[GET /api/tasks/[taskId]/subtasks]', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'サーバーエラーが発生しました' } },
      { status: 500 },
    )
  }
}

export const POST = async (
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

    const parentTask = await prisma.task.findUnique({
      where: { id: taskId },
      select: {
        id: true,
        projectId: true,
        parentTaskId: true,
        project: { select: { key: true } },
      },
    })

    if (!parentTask) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: '親タスクが見つかりません' } },
        { status: 404 },
      )
    }

    if (parentTask.parentTaskId) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'サブタスクにはさらにサブタスクを作成できません' } },
        { status: 400 },
      )
    }

    const member = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId: parentTask.projectId,
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
        { error: { code: 'FORBIDDEN', message: '閲覧者はサブタスクを作成できません' } },
        { status: 403 },
      )
    }

    const body = await request.json()
    const parsed = createSubtaskSchema.safeParse(body)

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

    const subtask = await prisma.$transaction(async (tx) => {
      const lastTask = await tx.task.findFirst({
        where: { projectId: parentTask.projectId },
        orderBy: { taskNumber: 'desc' },
        select: { taskNumber: true },
      })
      const taskNumber = (lastTask?.taskNumber ?? 0) + 1

      const created = await tx.task.create({
        data: {
          title: parsed.data.title,
          description: parsed.data.description,
          priority: parsed.data.priority,
          status: parsed.data.status,
          assigneeId: parsed.data.assigneeId || null,
          dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null,
          projectId: parentTask.projectId,
          reporterId: session.user.id,
          parentTaskId: taskId,
          taskNumber,
        },
        select: {
          id: true,
          taskNumber: true,
          title: true,
          status: true,
          priority: true,
          dueDate: true,
          assignee: { select: { id: true, name: true, avatarUrl: true } },
        },
      })

      await tx.activityLog.create({
        data: {
          action: 'CREATED',
          entityType: 'task',
          entityId: created.id,
          userId: session.user.id,
          projectId: parentTask.projectId,
          newValue: {
            title: created.title,
            taskNumber: created.taskNumber,
            taskKey: `${parentTask.project.key}-${created.taskNumber}`,
            parentTaskId: taskId,
          },
        },
      })

      // 通知トリガー: サブタスク作成時のアサイン
      if (parsed.data.assigneeId && parsed.data.assigneeId !== session.user.id) {
        await notifyTaskAssigned(tx, {
          assigneeId: parsed.data.assigneeId,
          assignerUserId: session.user.id,
          assignerName: session.user.name ?? '',
          taskKey: `${parentTask.project.key}-${created.taskNumber}`,
          taskTitle: created.title,
          projectId: parentTask.projectId,
          taskId: created.id,
        })
      }

      return created
    })

    return NextResponse.json({ data: subtask }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/tasks/[taskId]/subtasks]', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'サーバーエラーが発生しました' } },
      { status: 500 },
    )
  }
}
