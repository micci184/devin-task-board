import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'

import { NotificationList } from '@/components/notifications/NotificationList'

const NotificationsPage = async () => {
  const session = await auth()
  if (!session?.user) {
    redirect('/login')
  }

  const perPage = 20
  const where = { userId: session.user.id }

  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: perPage,
    }),
    prisma.notification.count({ where }),
  ])

  const totalPages = Math.ceil(total / perPage)

  const serialized = notifications.map((n) => ({
    id: n.id,
    type: n.type,
    title: n.title,
    message: n.message,
    isRead: n.isRead,
    linkUrl: n.linkUrl,
    createdAt: n.createdAt.toISOString(),
  }))

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-xl font-bold text-foreground">通知</h1>
      <NotificationList
        initialNotifications={serialized}
        initialPagination={{
          page: 1,
          perPage,
          total,
          totalPages,
        }}
      />
    </div>
  )
}
export default NotificationsPage
