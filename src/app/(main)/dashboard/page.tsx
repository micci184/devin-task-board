import { subDays, startOfDay, format } from 'date-fns'
import {
  ListTodo,
  CheckCircle2,
  Clock,
  AlertTriangle,
} from 'lucide-react'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { StatCard } from '@/components/dashboard/StatCard'
import { DashboardCharts } from '@/components/dashboard/DashboardCharts'
import { MyTaskList } from '@/components/dashboard/MyTaskList'
import { ActivityFeed } from '@/components/dashboard/ActivityFeed'

const DashboardPage = async () => {
  const session = await auth()
  const userId = session?.user?.id

  if (!userId) {
    return null
  }

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

  // クライアントコンポーネント用に日付をシリアライズ
  const serializedMyTasks = myTasks.map((t) => ({
    ...t,
    dueDate: t.dueDate?.toISOString() ?? null,
    startDate: t.startDate?.toISOString() ?? null,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  }))

  const serializedUpcomingTasks = upcomingTasks.map((t) => ({
    ...t,
    dueDate: t.dueDate?.toISOString() ?? null,
    startDate: t.startDate?.toISOString() ?? null,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  }))

  const serializedActivities = recentActivities.map((a) => ({
    ...a,
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">ダッシュボード</h1>
        <p className="mt-1 text-sm text-foreground/60">
          ようこそ、{session?.user?.name ?? 'ユーザー'} さん
        </p>
      </div>

      {/* サマリーカード */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="総タスク数"
          value={totalTasks}
          icon={ListTodo}
          color="oklch(0.55 0.12 250)"
        />
        <StatCard
          title="完了"
          value={completedTasks}
          icon={CheckCircle2}
          color="oklch(0.55 0.15 160)"
        />
        <StatCard
          title="進行中"
          value={inProgressTasks}
          icon={Clock}
          color="oklch(0.65 0.15 85)"
        />
        <StatCard
          title="期限超過"
          value={overdueTasks}
          icon={AlertTriangle}
          color="oklch(0.55 0.22 27)"
        />
      </div>

      {/* グラフ（"use client" コンポーネント） */}
      <DashboardCharts
        statusChart={statusChart}
        priorityChart={priorityChart}
        completionTrend={completionTrend}
      />

      {/* タスク一覧 */}
      <div className="grid gap-6 lg:grid-cols-2">
        <MyTaskList tasks={serializedMyTasks} title="自分のタスク" />
        <MyTaskList tasks={serializedUpcomingTasks} title="期限が近いタスク" />
      </div>

      {/* アクティビティフィード */}
      <ActivityFeed activities={serializedActivities} />
    </div>
  )
}
export default DashboardPage
