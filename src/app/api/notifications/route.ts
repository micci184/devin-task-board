import { NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { listNotificationsSchema } from '@/lib/validations/notification'

import type { NextRequest } from 'next/server'
import type { Prisma } from '@prisma/client'

export const GET = async (request: NextRequest) => {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: '認証が必要です' } },
        { status: 401 },
      )
    }

    const url = new URL(request.url)
    const parsed = listNotificationsSchema.safeParse({
      page: url.searchParams.get('page') ?? undefined,
      perPage: url.searchParams.get('perPage') ?? undefined,
      isRead: url.searchParams.get('isRead') ?? undefined,
    })

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

    const { page, perPage, isRead } = parsed.data

    const where: Prisma.NotificationWhereInput = {
      userId: session.user.id,
    }
    if (isRead !== undefined) {
      where.isRead = isRead
    }

    const total = await prisma.notification.count({ where })
    const totalPages = Math.ceil(total / perPage)

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * perPage,
      take: perPage,
    })

    return NextResponse.json({
      data: notifications,
      pagination: { page, perPage, total, totalPages },
    })
  } catch (error) {
    console.error('[GET /api/notifications]', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'サーバーエラーが発生しました' } },
      { status: 500 },
    )
  }
}
