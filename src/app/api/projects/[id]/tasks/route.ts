import { NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { createTaskSchema } from '@/lib/validations/task'

import type { NextRequest } from 'next/server'

const VALID_SORT_BY = ['taskNumber', 'title', 'status', 'priority', 'dueDate', 'createdAt'] as const
type SortByField = (typeof VALID_SORT_BY)[number]

const VALID_SORT_ORDER = ['asc', 'desc'] as const
type SortOrder = (typeof VALID_SORT_ORDER)[number]

export const GET = async (
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

    const { id: projectId } = await params

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    })
    if (!project) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'プロジェクトが見つかりません' } },
        { status: 404 },
      )
    }

    const url = new URL(request.url)
    const pageParam = url.searchParams.get('page')
    const perPageParam = url.searchParams.get('perPage')
    const sortByParam = url.searchParams.get('sortBy')
    const sortOrderParam = url.searchParams.get('sortOrder')
    const categoryIdsParam = url.searchParams.get('categoryIds')

    const page = Math.max(1, parseInt(pageParam ?? '1', 10) || 1)
    const perPage = Math.min(100, Math.max(1, parseInt(perPageParam ?? '20', 10) || 20))
    const sortBy: SortByField = VALID_SORT_BY.includes(sortByParam as SortByField)
      ? (sortByParam as SortByField)
      : 'createdAt'
    const sortOrder: SortOrder = VALID_SORT_ORDER.includes(sortOrderParam as SortOrder)
      ? (sortOrderParam as SortOrder)
      : 'desc'

    const categoryIds = categoryIdsParam
      ? categoryIdsParam.split(',').filter(Boolean)
      : []

    const where: Record<string, unknown> = { projectId }
    if (categoryIds.length > 0) {
      where.taskCategories = {
        some: { categoryId: { in: categoryIds } },
      }
    }

    const total = await prisma.task.count({ where })
    const totalPages = Math.ceil(total / perPage)

    const tasks = await prisma.task.findMany({
      where,
      include: {
        assignee: { select: { id: true, name: true, avatarUrl: true } },
        reporter: { select: { id: true, name: true, avatarUrl: true } },
        taskCategories: { include: { category: true } },
      },
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * perPage,
      take: perPage,
    })

    return NextResponse.json({
      data: tasks,
      pagination: { page, perPage, total, totalPages },
    })
  } catch (error) {
    console.error('[GET /api/projects/[id]/tasks]', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'サーバーエラーが発生しました' } },
      { status: 500 },
    )
  }
}

export const POST = async (
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

    const { id: projectId } = await params

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    })
    if (!project) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'プロジェクトが見つかりません' } },
        { status: 404 },
      )
    }

    const body = await request.json()
    const parsed = createTaskSchema.safeParse(body)

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

    const task = await prisma.$transaction(async (tx) => {
      const lastTask = await tx.task.findFirst({
        where: { projectId },
        orderBy: { taskNumber: 'desc' },
        select: { taskNumber: true },
      })
      const taskNumber = (lastTask?.taskNumber ?? 0) + 1

      const { categoryIds: rawCategoryIds, ...rest } = parsed.data
      const uniqueCategoryIds = rawCategoryIds ? [...new Set(rawCategoryIds)] : undefined

      if (uniqueCategoryIds && uniqueCategoryIds.length > 0) {
        const validCategories = await tx.category.findMany({
          where: { id: { in: uniqueCategoryIds }, projectId },
          select: { id: true },
        })
        if (validCategories.length !== uniqueCategoryIds.length) {
          throw new Error('INVALID_CATEGORY')
        }
      }

      const created = await tx.task.create({
        data: {
          title: rest.title,
          description: rest.description,
          priority: rest.priority,
          status: rest.status,
          assigneeId: rest.assigneeId || null,
          dueDate: rest.dueDate ? new Date(rest.dueDate) : null,
          projectId,
          reporterId: session.user.id,
          taskNumber,
          ...(uniqueCategoryIds && uniqueCategoryIds.length > 0
            ? {
                taskCategories: {
                  create: uniqueCategoryIds.map((categoryId) => ({ categoryId })),
                },
              }
            : {}),
        },
        include: {
          assignee: { select: { id: true, name: true, avatarUrl: true } },
          reporter: { select: { id: true, name: true, avatarUrl: true } },
          taskCategories: { include: { category: true } },
        },
      })

      return created
    })

    return NextResponse.json({ data: task }, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message === 'INVALID_CATEGORY') {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: '指定されたカテゴリが見つからないか、このプロジェクトに属していません',
          },
        },
        { status: 400 },
      )
    }
    console.error('[POST /api/projects/[id]/tasks]', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'サーバーエラーが発生しました' } },
      { status: 500 },
    )
  }
}
