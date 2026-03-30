import { NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export const PATCH = async () => {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: '認証が必要です' } },
        { status: 401 },
      )
    }

    const result = await prisma.notification.updateMany({
      where: {
        userId: session.user.id,
        isRead: false,
      },
      data: { isRead: true },
    })

    return NextResponse.json({ data: { count: result.count } })
  } catch (error) {
    console.error('[PATCH /api/notifications/read-all]', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'サーバーエラーが発生しました' } },
      { status: 500 },
    )
  }
}
