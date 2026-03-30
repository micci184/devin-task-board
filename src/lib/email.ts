import { Resend } from 'resend'

import type { NotificationType } from '@prisma/client'

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null

const fromEmail = process.env.RESEND_FROM_EMAIL ?? 'noreply@example.com'
const appUrl = process.env.AUTH_URL ?? 'http://localhost:3000'

type EmailNotificationParams = {
  to: string
  type: NotificationType
  title: string
  message: string
  linkUrl?: string | null
  locale: string
}

const subjectMap: Record<NotificationType, { ja: string; en: string }> = {
  TASK_ASSIGNED: {
    ja: 'タスクがアサインされました',
    en: 'Task Assigned to You',
  },
  TASK_COMMENTED: {
    ja: 'タスクにコメントが追加されました',
    en: 'New Comment on Task',
  },
  TASK_STATUS_CHANGED: {
    ja: 'タスクのステータスが変更されました',
    en: 'Task Status Changed',
  },
  TASK_DUE_SOON: {
    ja: 'タスクの期限が近づいています',
    en: 'Task Due Soon',
  },
  MENTIONED: {
    ja: 'コメントでメンションされました',
    en: 'You Were Mentioned',
  },
}

const escapeHtml = (str: string): string =>
  str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')

const buildHtmlBody = (params: EmailNotificationParams): string => {
  const isJa = params.locale === 'ja'
  const taskLink = params.linkUrl ? `${appUrl}${params.linkUrl}` : null

  const viewTaskLabel = isJa ? 'タスクを確認する' : 'View Task'
  const footerText = isJa
    ? 'この通知はアプリの設定からオフにできます。'
    : 'You can turn off email notifications in your profile settings.'

  return `<!DOCTYPE html>
<html lang="${params.locale}">
<head><meta charset="UTF-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
  <div style="border-bottom: 2px solid #6366f1; padding-bottom: 16px; margin-bottom: 24px;">
    <h2 style="margin: 0; color: #6366f1;">devin-task-board</h2>
  </div>
  <h3 style="margin: 0 0 8px 0; color: #111;">${escapeHtml(params.title)}</h3>
  <p style="margin: 0 0 24px 0; color: #555; line-height: 1.6;">${escapeHtml(params.message)}</p>
  ${
    taskLink
      ? `<a href="${taskLink}" style="display: inline-block; background: #6366f1; color: #fff; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: 500;">${viewTaskLabel}</a>`
      : ''
  }
  <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0 16px 0;">
  <p style="font-size: 12px; color: #999;">${footerText}</p>
</body>
</html>`
}

/**
 * メール通知を送信する
 * Resend API キーが未設定の場合はスキップ
 * 送信失敗時はエラーログのみ記録し、例外はスローしない
 */
export const sendNotificationEmail = async (
  params: EmailNotificationParams,
): Promise<void> => {
  if (!resend) {
    return
  }

  try {
    const locale = params.locale === 'en' ? 'en' : 'ja'
    const subject = subjectMap[params.type][locale]
    const html = buildHtmlBody(params)

    const { error } = await resend.emails.send({
      from: fromEmail,
      to: params.to,
      subject,
      html,
    })

    if (error) {
      console.error('[Email] Failed to send notification email:', error)
    }
  } catch (error) {
    console.error('[Email] Unexpected error sending notification email:', error)
  }
}

/**
 * 複数の宛先にメール通知を一括送信する
 * 各送信は独立して処理され、1件の失敗が他に影響しない
 */
export const sendNotificationEmails = async (
  emails: EmailNotificationParams[],
): Promise<void> => {
  if (!resend || emails.length === 0) {
    return
  }

  await Promise.allSettled(
    emails.map((params) => sendNotificationEmail(params)),
  )
}
