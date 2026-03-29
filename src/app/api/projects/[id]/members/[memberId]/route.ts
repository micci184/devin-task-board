import { NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { updateMemberRoleSchema } from '@/lib/validations/member'

import type { NextRequest } from 'next/server'

export const PATCH = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> },
) => {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: '認証が必要です' } },
        { status: 401 },
      )
    }

    const { id: projectId, memberId } = await params

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    })
    if (!project) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'プロジェクトが見つかりません' } },
        { status: 404 },
      )
    }

    const currentMembership = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId: session.user.id } },
    })
    if (!currentMembership) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'このプロジェクトへのアクセス権がありません' } },
        { status: 403 },
      )
    }

    if (currentMembership.role !== 'OWNER' && currentMembership.role !== 'ADMIN') {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: '権限変更はオーナーまたは管理者のみ実行できます' } },
        { status: 403 },
      )
    }

    const targetMember = await prisma.projectMember.findUnique({
      where: { id: memberId, projectId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            avatarUrl: true,
            role: true,
            locale: true,
            theme: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    })
    if (!targetMember) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: '対象メンバーが見つかりません' } },
        { status: 404 },
      )
    }

    if (targetMember.role === 'OWNER') {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'オーナーの権限は変更できません' } },
        { status: 403 },
      )
    }

    const body = await request.json()
    const parsed = updateMemberRoleSchema.safeParse(body)

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

    const updated = await prisma.projectMember.update({
      where: { id: memberId },
      data: { role: parsed.data.role },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            avatarUrl: true,
            role: true,
            locale: true,
            theme: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    })

    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error('[PATCH /api/projects/[id]/members/[memberId]]', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'サーバーエラーが発生しました' } },
      { status: 500 },
    )
  }
}

export const DELETE = async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> },
) => {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: '認証が必要です' } },
        { status: 401 },
      )
    }

    const { id: projectId, memberId } = await params

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    })
    if (!project) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'プロジェクトが見つかりません' } },
        { status: 404 },
      )
    }

    const currentMembership = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId: session.user.id } },
    })
    if (!currentMembership) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'このプロジェクトへのアクセス権がありません' } },
        { status: 403 },
      )
    }

    if (currentMembership.role !== 'OWNER' && currentMembership.role !== 'ADMIN') {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'メンバー削除はオーナーまたは管理者のみ実行できます' } },
        { status: 403 },
      )
    }

    const targetMember = await prisma.projectMember.findUnique({
      where: { id: memberId, projectId },
    })
    if (!targetMember) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: '対象メンバーが見つかりません' } },
        { status: 404 },
      )
    }

    if (targetMember.role === 'OWNER') {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'オーナーは削除できません' } },
        { status: 403 },
      )
    }

    await prisma.projectMember.delete({
      where: { id: memberId },
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('[DELETE /api/projects/[id]/members/[memberId]]', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'サーバーエラーが発生しました' } },
      { status: 500 },
    )
  }
}
