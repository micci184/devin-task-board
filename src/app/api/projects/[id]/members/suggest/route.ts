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

    const { id } = await params
    const query = request.nextUrl.searchParams.get('q') ?? ''

    const membership = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId: id, userId: session.user.id } },
    })
    if (!membership) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'このプロジェクトへのアクセス権がありません' } },
        { status: 403 },
      )
    }

    const members = await prisma.projectMember.findMany({
      where: {
        projectId: id,
        user: query
          ? { name: { contains: query, mode: 'insensitive' } }
          : undefined,
      },
      select: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
      take: 10,
      orderBy: { user: { name: 'asc' } },
    })

    const data = members.map((m) => m.user)

    return NextResponse.json({ data })
  } catch (error) {
    console.error('[GET /api/projects/[id]/members/suggest]', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'サーバーエラーが発生しました' } },
      { status: 500 },
    )
  }
}
