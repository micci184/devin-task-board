import { NextResponse } from 'next/server'
import { subDays, startOfDay, format } from 'date-fns'

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export const GET = async () => {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: '認証が必要です' } },
        { status: 401 },
      )
    }

    const userId = session.user.id

    // ユーザーが参加しているプロジェクトを取得
    const memberships = await prisma.projectMember.findMany({
      where: { userId },
      select: { projectId: true },
    })
    const projectIds = memberships.map((m) => m.projectId)

    const now = new Date()

    // サマリーカード用の集計
    const [totalTasks, completedTasks, inProgressTasks, overdueTasks] =
      await Promise.all([
        prisma.task.count({
          where: { projectId: { in: projectIds } },
        }),
        prisma.task.count({
          where: { projectId: { in: projectIds }, status: 'DONE' },
        }),
        prisma.task.count({
          where: { projectId: { in: projectIds }, status: 'IN_PROGRESS' },
        }),
        prisma.task.count({
          where: {
            projectId: { in: projectIds },
            status: { not: 'DONE' },
            dueDate: { lt: now },
          },
        }),
      ])

    // ステータス別棒グラフデータ
    const statusGroups = await prisma.task.groupBy({
      by: ['status'],
      where: { projectId: { in: projectIds } },
      _count: { id: true },
    })
    const allStatuses = ['BACKLOG', 'TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'] as const
    const statusChart = allStatuses.map((status) => ({
      status,
      count: statusGroups.find((g) => g.status === status)?._count.id ?? 0,
    }))

    // 優先度別円グラフデータ
    const priorityGroups = await prisma.task.groupBy({
      by: ['priority'],
      where: { projectId: { in: projectIds } },
      _count: { id: true },
    })
    const allPriorities = ['URGENT', 'HIGH', 'MEDIUM', 'LOW', 'NONE'] as const
    const priorityChart = allPriorities.map((priority) => ({
      priority,
      count: priorityGroups.find((g) => g.priority === priority)?._count.id ?? 0,
    }))

    // 直近7日間の完了タスク推移
    const sevenDaysAgo = startOfDay(subDays(now, 6))
    const completedRecently = await prisma.task.findMany({
      where: {
        projectId: { in: projectIds },
        status: 'DONE',
        updatedAt: { gte: sevenDaysAgo },
      },
      select: { updatedAt: true },
    })

    const completionTrend: { date: string; count: number }[] = []
    for (let i = 6; i >= 0; i--) {
      const day = startOfDay(subDays(now, i))
      const nextDay = startOfDay(subDays(now, i - 1))
      const dateStr = format(day, 'yyyy-MM-dd')
      const count = completedRecently.filter(
        (t) => t.updatedAt >= day && t.updatedAt < nextDay,
      ).length
      completionTrend.push({ date: dateStr, count })
    }

    // 自分にアサインされたタスク上位5件
    const myTasks = await prisma.task.findMany({
      where: {
        projectId: { in: projectIds },
        assigneeId: userId,
        status: { not: 'DONE' },
      },
      include: {
        project: { select: { key: true } },
      },
      orderBy: { updatedAt: 'desc' },
      take: 5,
    })

    // 期限が近いタスク上位5件
    const upcomingTasks = await prisma.task.findMany({
      where: {
        projectId: { in: projectIds },
        status: { not: 'DONE' },
        dueDate: { gte: now },
      },
      include: {
        project: { select: { key: true } },
      },
      orderBy: { dueDate: 'asc' },
      take: 5,
    })

    // 最近のアクティビティフィード上位10件
    const recentActivities = await prisma.activityLog.findMany({
      where: { projectId: { in: projectIds } },
      include: {
        user: { select: { id: true, name: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    })

    return NextResponse.json({
      data: {
        summary: {
          totalTasks,
          completedTasks,
          inProgressTasks,
          overdueTasks,
        },
        statusChart,
        priorityChart,
        completionTrend,
        myTasks,
        upcomingTasks,
        recentActivities,
      },
    })
  } catch (error) {
    console.error('[GET /api/dashboard]', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'サーバーエラーが発生しました' } },
      { status: 500 },
    )
  }
}
