import { NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { searchQuerySchema } from '@/lib/validations/search'

import type { NextRequest } from 'next/server'

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
    const rawParams = {
      q: url.searchParams.get('q') ?? '',
      status: url.searchParams.get('status') || undefined,
      priority: url.searchParams.get('priority') || undefined,
      assigneeId: url.searchParams.get('assigneeId') || undefined,
      categoryId: url.searchParams.get('categoryId') || undefined,
      dueDateFrom: url.searchParams.get('dueDateFrom') || undefined,
      dueDateTo: url.searchParams.get('dueDateTo') || undefined,
    }

    const parsed = searchQuerySchema.safeParse(rawParams)
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

    const { q, status, priority, assigneeId, categoryId, dueDateFrom, dueDateTo } = parsed.data

    // Find tasks matching the keyword via comments
    const commentMatchTaskIds = await prisma.comment.findMany({
      where: {
        content: { contains: q, mode: 'insensitive' },
      },
      select: { taskId: true },
      distinct: ['taskId'],
    })
    const commentTaskIds = commentMatchTaskIds.map((c) => c.taskId)

    // Parse taskNumber from query if it matches pattern like "DTB-123" or just a number
    let taskNumberMatch: number | undefined
    const numberOnlyMatch = q.match(/^\d+$/)
    const taskKeyMatch = q.match(/^[A-Za-z]+-(\d+)$/i)
    if (numberOnlyMatch) {
      taskNumberMatch = parseInt(q, 10)
    } else if (taskKeyMatch) {
      taskNumberMatch = parseInt(taskKeyMatch[1], 10)
    }

    // Build the OR conditions for keyword search
    const orConditions: Record<string, unknown>[] = [
      { title: { contains: q, mode: 'insensitive' } },
      { description: { contains: q, mode: 'insensitive' } },
    ]

    if (taskNumberMatch !== undefined) {
      orConditions.push({ taskNumber: taskNumberMatch })
    }

    if (commentTaskIds.length > 0) {
      orConditions.push({ id: { in: commentTaskIds } })
    }

    // Build filter conditions
    const andConditions: Record<string, unknown>[] = []

    if (status) {
      andConditions.push({ status })
    }
    if (priority) {
      andConditions.push({ priority })
    }
    if (assigneeId) {
      andConditions.push({ assigneeId })
    }
    if (categoryId) {
      andConditions.push({
        taskCategories: { some: { categoryId } },
      })
    }
    if (dueDateFrom) {
      andConditions.push({ dueDate: { gte: new Date(dueDateFrom) } })
    }
    if (dueDateTo) {
      andConditions.push({ dueDate: { lte: new Date(dueDateTo) } })
    }

    const where = {
      OR: orConditions,
      ...(andConditions.length > 0 ? { AND: andConditions } : {}),
    }

    const tasks = await prisma.task.findMany({
      where,
      include: {
        project: { select: { id: true, name: true, key: true } },
        assignee: { select: { id: true, name: true, avatarUrl: true } },
        reporter: { select: { id: true, name: true, avatarUrl: true } },
        taskCategories: { include: { category: true } },
      },
      orderBy: { updatedAt: 'desc' },
      take: 50,
    })

    return NextResponse.json({ data: { tasks } })
  } catch (error) {
    console.error('[GET /api/search]', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'サーバーエラーが発生しました' } },
      { status: 500 },
    )
  }
}
