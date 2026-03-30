import type { PrismaClient } from '@prisma/client'
import type { NotificationType } from '@prisma/client'

type TransactionClient = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>

type CreateNotificationParams = {
  type: NotificationType
  title: string
  message: string
  userId: string
  linkUrl?: string
}

/**
 * 通知を1件作成する
 */
export const createNotification = async (
  tx: TransactionClient,
  params: CreateNotificationParams,
) => {
  return tx.notification.create({
    data: {
      type: params.type,
      title: params.title,
      message: params.message,
      userId: params.userId,
      linkUrl: params.linkUrl ?? null,
    },
  })
}

/**
 * 通知を複数件まとめて作成する
 */
export const createNotifications = async (
  tx: TransactionClient,
  notifications: CreateNotificationParams[],
) => {
  if (notifications.length === 0) return
  return tx.notification.createMany({
    data: notifications.map((n) => ({
      type: n.type,
      title: n.title,
      message: n.message,
      userId: n.userId,
      linkUrl: n.linkUrl ?? null,
    })),
  })
}

/**
 * タスクアサイン時の通知を生成する
 * - 自分自身にアサインした場合は通知しない
 */
export const notifyTaskAssigned = async (
  tx: TransactionClient,
  params: {
    assigneeId: string
    assignerUserId: string
    assignerName: string
    taskKey: string
    taskTitle: string
    projectId: string
    taskId: string
  },
) => {
  if (params.assigneeId === params.assignerUserId) return

  await createNotification(tx, {
    type: 'TASK_ASSIGNED',
    title: `${params.assignerName} があなたにタスクをアサインしました`,
    message: `${params.taskKey}: ${params.taskTitle}`,
    userId: params.assigneeId,
    linkUrl: `/projects/${params.projectId}/tasks/${params.taskId}`,
  })
}

/**
 * コメント追加時の通知を生成する
 * - タスクの担当者・起票者に通知（コメント投稿者自身は除外）
 */
export const notifyTaskCommented = async (
  tx: TransactionClient,
  params: {
    commentAuthorId: string
    commentAuthorName: string
    taskKey: string
    taskId: string
    projectId: string
    assigneeId: string | null
    reporterId: string
  },
) => {
  const recipientIds = new Set<string>()
  if (params.assigneeId) recipientIds.add(params.assigneeId)
  recipientIds.add(params.reporterId)
  recipientIds.delete(params.commentAuthorId)

  if (recipientIds.size === 0) return

  const notifications: CreateNotificationParams[] = [...recipientIds].map((userId) => ({
    type: 'TASK_COMMENTED' as const,
    title: `${params.commentAuthorName} がコメントしました`,
    message: `${params.taskKey} にコメントが追加されました`,
    userId,
    linkUrl: `/projects/${params.projectId}/tasks/${params.taskId}`,
  }))

  await createNotifications(tx, notifications)
}

/**
 * ステータス変更時の通知を生成する
 * - タスクの担当者・起票者に通知（変更者自身は除外）
 */
export const notifyTaskStatusChanged = async (
  tx: TransactionClient,
  params: {
    changerUserId: string
    changerName: string
    taskKey: string
    taskId: string
    projectId: string
    assigneeId: string | null
    reporterId: string
    oldStatus: string
    newStatus: string
  },
) => {
  const recipientIds = new Set<string>()
  if (params.assigneeId) recipientIds.add(params.assigneeId)
  recipientIds.add(params.reporterId)
  recipientIds.delete(params.changerUserId)

  if (recipientIds.size === 0) return

  const notifications: CreateNotificationParams[] = [...recipientIds].map((userId) => ({
    type: 'TASK_STATUS_CHANGED' as const,
    title: `${params.taskKey} のステータスが変更されました`,
    message: `${params.oldStatus} → ${params.newStatus}`,
    userId,
    linkUrl: `/projects/${params.projectId}/tasks/${params.taskId}`,
  }))

  await createNotifications(tx, notifications)
}

/**
 * @メンション時の通知を生成する
 * - @[ユーザー名] 形式のメンションを解析し、該当プロジェクトメンバーに通知
 * - メンション者自身は除外
 */
export const notifyMentioned = async (
  tx: TransactionClient,
  params: {
    content: string
    authorId: string
    authorName: string
    taskKey: string
    taskId: string
    projectId: string
  },
) => {
  const mentionPattern = /@\[([^\]]+)\]/g
  const mentionedNames = new Set<string>()
  let match: RegExpExecArray | null
  while ((match = mentionPattern.exec(params.content)) !== null) {
    mentionedNames.add(match[1])
  }

  if (mentionedNames.size === 0) return

  const projectMembers = await tx.projectMember.findMany({
    where: { projectId: params.projectId },
    include: { user: { select: { id: true, name: true } } },
  })

  const taskUrl = `/projects/${params.projectId}/tasks/${params.taskId}`

  const notifications: CreateNotificationParams[] = projectMembers
    .filter(
      (pm) =>
        mentionedNames.has(pm.user.name) &&
        pm.user.id !== params.authorId,
    )
    .map((pm) => ({
      type: 'MENTIONED' as const,
      title: `${params.authorName} があなたをメンションしました`,
      message: `${params.taskKey} のコメントであなたがメンションされました`,
      userId: pm.user.id,
      linkUrl: taskUrl,
    }))

  await createNotifications(tx, notifications)
}
