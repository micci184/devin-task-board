import { NextResponse } from 'next/server'

import { z } from 'zod'

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

import type { NextRequest } from 'next/server'

const toggleReadSchema = z.object({
  isRead: z.boolean().optional(),
})

export const PATCH = async (
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

    const { id } = await params

    const notification = await prisma.notification.findUnique({
      where: { id },
    })

    if (!notification) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: '通知が見つかりません' } },
        { status: 404 },
      )
    }

    if (notification.userId !== session.user.id) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'この通知へのアクセス権がありません' } },
        { status: 403 },
      )
    }

    let newIsRead = !notification.isRead

    const contentType = request.headers.get('content-type')
    if (contentType?.includes('application/json')) {
      const body = await request.json()
      const parsed = toggleReadSchema.safeParse(body)
      if (!parsed.success) {
        return NextResponse.json(
          { error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0].message } },
          { status: 400 },
        )
      }
      if (parsed.data.isRead !== undefined) {
        newIsRead = parsed.data.isRead
      }
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: { isRead: newIsRead },
    })

    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error('[PATCH /api/notifications/[id]/read]', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'サーバーエラーが発生しました' } },
      { status: 500 },
    )
  }
}
