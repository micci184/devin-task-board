import { NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { createCommentSchema } from '@/lib/validations/comment'

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

    const comments = await prisma.comment.findMany({
      where: { taskId },
      include: {
        author: { select: { id: true, name: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json({ data: comments })
  } catch (error) {
    console.error('[GET /api/tasks/[taskId]/comments]', error)
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

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: {
        id: true,
        projectId: true,
        project: { select: { key: true } },
        taskNumber: true,
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
        { error: { code: 'FORBIDDEN', message: '閲覧者はコメントを投稿できません' } },
        { status: 403 },
      )
    }

    const body = await request.json()
    const parsed = createCommentSchema.safeParse(body)

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

    const comment = await prisma.$transaction(async (tx) => {
      const created = await tx.comment.create({
        data: {
          content: parsed.data.content,
          taskId,
          authorId: session.user.id,
        },
        include: {
          author: { select: { id: true, name: true, avatarUrl: true } },
        },
      })

      await tx.activityLog.create({
        data: {
          action: 'COMMENTED',
          entityType: 'comment',
          entityId: created.id,
          userId: session.user.id,
          projectId: task.projectId,
          newValue: {
            taskId,
            taskKey: `${task.project.key}-${task.taskNumber}`,
            content: parsed.data.content.substring(0, 200),
          },
        },
      })

      return created
    })

    return NextResponse.json({ data: comment }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/tasks/[taskId]/comments]', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'サーバーエラーが発生しました' } },
      { status: 500 },
    )
  }
}
