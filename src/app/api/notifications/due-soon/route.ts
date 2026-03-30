import { NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'
import { sendNotificationEmails } from '@/lib/email'

import type { NextRequest } from 'next/server'

/**
 * 期限1日前の通知を生成する API
 * cron ジョブや外部スケジューラから呼び出すことを想定
 * Authorization ヘッダーに CRON_SECRET を設定して認証する
 */
export const POST = async (request: NextRequest) => {
  try {
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: '認証が必要です' } },
        { status: 401 },
      )
    }

    const now = new Date()
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const startOfTomorrow = new Date(tomorrow)
    startOfTomorrow.setHours(0, 0, 0, 0)
    const endOfTomorrow = new Date(tomorrow)
    endOfTomorrow.setHours(23, 59, 59, 999)

    const tasksDueSoon = await prisma.task.findMany({
      where: {
        dueDate: {
          gte: startOfTomorrow,
          lte: endOfTomorrow,
        },
        status: {
          not: 'DONE',
        },
        assigneeId: {
          not: null,
        },
      },
      include: {
        project: { select: { id: true, key: true } },
      },
    })

    if (tasksDueSoon.length === 0) {
      return NextResponse.json({ data: { count: 0 } })
    }

    const existingNotifications = await prisma.notification.findMany({
      where: {
        type: 'TASK_DUE_SOON',
        createdAt: {
          gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
        },
        linkUrl: {
          in: tasksDueSoon.map(
            (t) => `/projects/${t.projectId}/tasks/${t.id}`,
          ),
        },
      },
      select: { linkUrl: true, userId: true },
    })

    const existingSet = new Set(
      existingNotifications.map((n) => `${n.userId}:${n.linkUrl}`),
    )

    const notifications = tasksDueSoon
      .filter((task) => {
        const key = `${task.assigneeId}:/projects/${task.projectId}/tasks/${task.id}`
        return !existingSet.has(key)
      })
      .map((task) => ({
        type: 'TASK_DUE_SOON' as const,
        title: '期限が近づいています',
        message: `${task.project.key}-${task.taskNumber}: ${task.title} の期限が明日です`,
        userId: task.assigneeId!,
        linkUrl: `/projects/${task.projectId}/tasks/${task.id}`,
      }))

    if (notifications.length > 0) {
      await prisma.notification.createMany({ data: notifications })

      // メール通知を送信
      const userIds = [...new Set(notifications.map((n) => n.userId))]
      const users = await prisma.user.findMany({
        where: { id: { in: userIds }, emailNotification: true },
        select: { id: true, email: true, locale: true },
      })
      const usersMap = new Map(users.map((u) => [u.id, u]))

      const emailParams = notifications
        .filter((n) => usersMap.has(n.userId))
        .map((n) => {
          const user = usersMap.get(n.userId)!
          return {
            to: user.email,
            type: n.type,
            title: n.title,
            message: n.message,
            linkUrl: n.linkUrl,
            locale: user.locale,
          }
        })

      if (emailParams.length > 0) {
        sendNotificationEmails(emailParams).catch(() => {
          // エラーは sendNotificationEmails 内でログ済み
        })
      }
    }

    return NextResponse.json({ data: { count: notifications.length } })
  } catch (error) {
    console.error('[POST /api/notifications/due-soon]', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'サーバーエラーが発生しました' } },
      { status: 500 },
    )
  }
}
