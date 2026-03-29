import { NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { updateCategorySchema } from '@/lib/validations/category'

import type { NextRequest } from 'next/server'

export const PATCH = async (
  request: NextRequest,
  { params }: { params: Promise<{ categoryId: string }> },
) => {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: '認証が必要です' } },
        { status: 401 },
      )
    }

    const { categoryId } = await params

    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    })
    if (!category) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'カテゴリが見つかりません' } },
        { status: 404 },
      )
    }

    const membership = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId: category.projectId, userId: session.user.id } },
    })
    if (!membership) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'このプロジェクトへのアクセス権がありません' } },
        { status: 403 },
      )
    }

    if (membership.role === 'VIEWER') {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'カテゴリの更新権限がありません' } },
        { status: 403 },
      )
    }

    const body = await request.json()
    const parsed = updateCategorySchema.safeParse(body)

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

    if (parsed.data.name !== undefined && parsed.data.name !== category.name) {
      const existing = await prisma.category.findUnique({
        where: { projectId_name: { projectId: category.projectId, name: parsed.data.name } },
      })
      if (existing) {
        return NextResponse.json(
          { error: { code: 'CONFLICT', message: '同じ名前のカテゴリが既に存在します' } },
          { status: 409 },
        )
      }
    }

    const updateData: Record<string, string> = {}
    if (parsed.data.name !== undefined) {
      updateData.name = parsed.data.name
    }
    if (parsed.data.color !== undefined) {
      updateData.color = parsed.data.color
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: '更新するフィールドが指定されていません' } },
        { status: 400 },
      )
    }

    const updated = await prisma.category.update({
      where: { id: categoryId },
      data: updateData,
    })

    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error('[PATCH /api/categories/[categoryId]]', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'サーバーエラーが発生しました' } },
      { status: 500 },
    )
  }
}

export const DELETE = async (
  _request: NextRequest,
  { params }: { params: Promise<{ categoryId: string }> },
) => {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: '認証が必要です' } },
        { status: 401 },
      )
    }

    const { categoryId } = await params

    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    })
    if (!category) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'カテゴリが見つかりません' } },
        { status: 404 },
      )
    }

    const membership = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId: category.projectId, userId: session.user.id } },
    })
    if (!membership) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'このプロジェクトへのアクセス権がありません' } },
        { status: 403 },
      )
    }

    if (membership.role === 'VIEWER') {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'カテゴリの削除権限がありません' } },
        { status: 403 },
      )
    }

    await prisma.category.delete({
      where: { id: categoryId },
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('[DELETE /api/categories/[categoryId]]', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'サーバーエラーが発生しました' } },
      { status: 500 },
    )
  }
}
