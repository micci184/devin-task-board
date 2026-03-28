import { NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { updateTaskSchema } from '@/lib/validations/task'

import type { NextRequest } from 'next/server'
import type { ActivityAction, Prisma } from '@prisma/client'

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
    const parsed = updateTaskSchema.safeParse(body)

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
        title: true,
        description: true,
        status: true,
        priority: true,
        assigneeId: true,
        dueDate: true,
        estimatedHours: true,
        actualHours: true,
        projectId: true,
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
        { error: { code: 'FORBIDDEN', message: '閲覧者はタスクを編集できません' } },
        { status: 403 },
      )
    }

    const data = parsed.data

    const updateData: Record<string, unknown> = {}
    if (data.title !== undefined) updateData.title = data.title
    if (data.description !== undefined) updateData.description = data.description
    if (data.status !== undefined) updateData.status = data.status
    if (data.priority !== undefined) updateData.priority = data.priority
    if (data.assigneeId !== undefined) updateData.assigneeId = data.assigneeId
    if (data.dueDate !== undefined) updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null
    if (data.estimatedHours !== undefined) updateData.estimatedHours = data.estimatedHours
    if (data.actualHours !== undefined) updateData.actualHours = data.actualHours

    const updatedTask = await prisma.$transaction(async (tx) => {
      const updated = await tx.task.update({
        where: { id: taskId },
        data: updateData,
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

      const activityLogs: Array<{
        action: ActivityAction
        oldValue: Prisma.JsonObject
        newValue: Prisma.JsonObject
      }> = []

      if (data.status !== undefined && data.status !== task.status) {
        activityLogs.push({
          action: 'STATUS_CHANGED',
          oldValue: { status: task.status },
          newValue: { status: data.status },
        })
      }

      if (data.assigneeId !== undefined && data.assigneeId !== task.assigneeId) {
        activityLogs.push({
          action: 'ASSIGNED',
          oldValue: { assigneeId: task.assigneeId },
          newValue: { assigneeId: data.assigneeId },
        })
      }

      const updatedFields: Prisma.JsonObject = {}
      const oldFields: Prisma.JsonObject = {}
      for (const key of ['title', 'description', 'priority', 'dueDate', 'estimatedHours', 'actualHours'] as const) {
        if (data[key] !== undefined) {
          const oldVal = key === 'dueDate' ? (task.dueDate ? task.dueDate.toISOString() : null) : task[key]
          const newVal = data[key]
          if (String(oldVal) !== String(newVal)) {
            updatedFields[key] = newVal as Prisma.JsonValue
            oldFields[key] = oldVal as Prisma.JsonValue
          }
        }
      }

      if (Object.keys(updatedFields).length > 0) {
        activityLogs.push({
          action: 'UPDATED',
          oldValue: oldFields,
          newValue: updatedFields,
        })
      }

      for (const log of activityLogs) {
        await tx.activityLog.create({
          data: {
            action: log.action,
            entityType: 'task',
            entityId: taskId,
            userId: session.user.id,
            projectId: task.projectId,
            oldValue: log.oldValue,
            newValue: log.newValue,
          },
        })
      }

      return updated
    })

    return NextResponse.json({ data: updatedTask })
  } catch (error) {
    console.error('[PATCH /api/tasks/[taskId]]', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'サーバーエラーが発生しました' } },
      { status: 500 },
    )
  }
}
