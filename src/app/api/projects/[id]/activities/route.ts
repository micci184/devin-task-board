import { NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

import type { NextRequest } from 'next/server'

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
      select: { id: true },
    })

    if (!project) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'プロジェクトが見つかりません' } },
        { status: 404 },
      )
    }

    const member = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId: session.user.id,
        },
      },
    })

    if (!member) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'このプロジェクトへのアクセス権がありません' } },
        { status: 403 },
      )
    }

    const { searchParams } = request.nextUrl
    const page = Math.max(1, Number(searchParams.get('page') ?? '1') || 1)
    const perPage = Math.min(50, Math.max(1, Number(searchParams.get('perPage') ?? '20') || 20))
    const skip = (page - 1) * perPage

    const [activities, total] = await Promise.all([
      prisma.activityLog.findMany({
        where: { projectId },
        include: {
          user: { select: { id: true, name: true, avatarUrl: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: perPage,
      }),
      prisma.activityLog.count({
        where: { projectId },
      }),
    ])

    return NextResponse.json({
      data: activities,
      pagination: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
      },
    })
  } catch (error) {
    console.error('[GET /api/projects/[id]/activities]', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'サーバーエラーが発生しました' } },
      { status: 500 },
    )
  }
}
