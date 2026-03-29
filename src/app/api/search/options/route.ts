import { NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

/**
 * GET /api/search/options
 * グローバル検索フィルターで使用する選択肢（担当者・カテゴリ）を返す。
 * ユーザーがアクセス可能なプロジェクト横断で取得する。
 */
export const GET = async () => {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: '認証が必要です' } },
        { status: 401 },
      )
    }

    // ユーザーがアクセス可能なプロジェクトを取得
    const memberships = await prisma.projectMember.findMany({
      where: { userId: session.user.id },
      select: { projectId: true },
    })
    const accessibleProjectIds = memberships.map((m) => m.projectId)

    // アクセス可能なプロジェクトのメンバー（重複排除）
    const members = await prisma.projectMember.findMany({
      where: { projectId: { in: accessibleProjectIds } },
      select: {
        user: { select: { id: true, name: true, avatarUrl: true } },
      },
      distinct: ['userId'],
    })
    const assignees = members.map((m) => m.user)

    // アクセス可能なプロジェクトのカテゴリ
    const categories = await prisma.category.findMany({
      where: { projectId: { in: accessibleProjectIds } },
      select: { id: true, name: true, color: true, projectId: true },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json({
      data: { assignees, categories },
    })
  } catch (error) {
    console.error('[GET /api/search/options]', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'サーバーエラーが発生しました' } },
      { status: 500 },
    )
  }
}
