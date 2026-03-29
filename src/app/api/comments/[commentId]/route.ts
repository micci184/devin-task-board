import { NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { updateCommentSchema } from '@/lib/validations/comment'

import type { NextRequest } from 'next/server'

export const PATCH = async (
  request: NextRequest,
  { params }: { params: Promise<{ commentId: string }> },
) => {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: '認証が必要です' } },
        { status: 401 },
      )
    }

    const { commentId } = await params

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        task: { select: { projectId: true } },
      },
    })

    if (!comment) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'コメントが見つかりません' } },
        { status: 404 },
      )
    }

    const member = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId: comment.task.projectId,
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

    if (comment.authorId !== session.user.id) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: '自分のコメントのみ編集できます' } },
        { status: 403 },
      )
    }

    const body = await request.json()
    const parsed = updateCommentSchema.safeParse(body)

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

    const updated = await prisma.comment.update({
      where: { id: commentId },
      data: { content: parsed.data.content },
      include: {
        author: { select: { id: true, name: true, avatarUrl: true } },
      },
    })

    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error('[PATCH /api/comments/[commentId]]', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'サーバーエラーが発生しました' } },
      { status: 500 },
    )
  }
}

export const DELETE = async (
  _request: NextRequest,
  { params }: { params: Promise<{ commentId: string }> },
) => {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: '認証が必要です' } },
        { status: 401 },
      )
    }

    const { commentId } = await params

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        task: { select: { projectId: true } },
      },
    })

    if (!comment) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'コメントが見つかりません' } },
        { status: 404 },
      )
    }

    const member = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId: comment.task.projectId,
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

    if (comment.authorId !== session.user.id) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: '自分のコメントのみ削除できます' } },
        { status: 403 },
      )
    }

    await prisma.comment.delete({
      where: { id: commentId },
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('[DELETE /api/comments/[commentId]]', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'サーバーエラーが発生しました' } },
      { status: 500 },
    )
  }
}
