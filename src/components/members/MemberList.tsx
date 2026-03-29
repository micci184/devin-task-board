'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

import { Crown, Shield, User, Eye, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import type { ProjectRole } from '@prisma/client'

interface MemberUser {
  id: string
  email: string
  name: string
  avatarUrl: string | null
}

interface Member {
  id: string
  projectId: string
  userId: string
  role: ProjectRole
  createdAt: string
  updatedAt: string
  user: MemberUser
}

interface MemberListProps {
  members: Member[]
  currentUserId: string
  currentUserRole: ProjectRole
}

const roleLabels: Record<ProjectRole, string> = {
  OWNER: 'オーナー',
  ADMIN: '管理者',
  MEMBER: 'メンバー',
  VIEWER: '閲覧者',
}

const roleIcons: Record<ProjectRole, typeof Crown> = {
  OWNER: Crown,
  ADMIN: Shield,
  MEMBER: User,
  VIEWER: Eye,
}

const roleBadgeColors: Record<ProjectRole, string> = {
  OWNER: 'bg-warning/15 text-warning',
  ADMIN: 'bg-primary/15 text-primary',
  MEMBER: 'bg-foreground/10 text-foreground/70',
  VIEWER: 'bg-foreground/5 text-foreground/50',
}

const selectableRoles: { value: ProjectRole; label: string }[] = [
  { value: 'ADMIN', label: '管理者' },
  { value: 'MEMBER', label: 'メンバー' },
  { value: 'VIEWER', label: '閲覧者' },
]

export const MemberList = ({ members, currentUserId, currentUserRole }: MemberListProps) => {
  const router = useRouter()
  const [loadingMemberId, setLoadingMemberId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const canManage = currentUserRole === 'OWNER' || currentUserRole === 'ADMIN'

  const handleRoleChange = async (member: Member, newRole: ProjectRole) => {
    if (newRole === member.role) return

    setLoadingMemberId(member.id)
    try {
      const res = await fetch(`/api/projects/${member.projectId}/members/${member.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      })

      const json = await res.json()

      if (!res.ok) {
        toast.error(json.error?.message ?? '権限の変更に失敗しました')
        return
      }

      toast.success(`${member.user.name} の権限を変更しました`)
      router.refresh()
    } catch {
      toast.error('ネットワークエラーが発生しました')
    } finally {
      setLoadingMemberId(null)
    }
  }

  const handleDelete = async (member: Member) => {
    setLoadingMemberId(member.id)
    try {
      const res = await fetch(`/api/projects/${member.projectId}/members/${member.id}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const json = await res.json()
        toast.error(json.error?.message ?? 'メンバーの削除に失敗しました')
        return
      }

      toast.success(`${member.user.name} をプロジェクトから削除しました`)
      setConfirmDeleteId(null)
      router.refresh()
    } catch {
      toast.error('ネットワークエラーが発生しました')
    } finally {
      setLoadingMemberId(null)
    }
  }

  return (
    <div className="divide-y divide-foreground/10 rounded-lg border border-foreground/10">
      {members.map((member) => {
        const Icon = roleIcons[member.role]
        const isOwner = member.role === 'OWNER'
        const isSelf = member.userId === currentUserId
        const isLoading = loadingMemberId === member.id
        const isConfirmingDelete = confirmDeleteId === member.id

        return (
          <div
            key={member.id}
            className="flex items-center justify-between px-4 py-3"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                {member.user.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  {member.user.name}
                  {isSelf && <span className="ml-1 text-xs text-foreground/40">（自分）</span>}
                </p>
                <p className="text-xs text-foreground/60">{member.user.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {canManage && !isOwner && !isSelf ? (
                <select
                  value={member.role}
                  onChange={(e) => handleRoleChange(member, e.target.value as ProjectRole)}
                  disabled={isLoading}
                  className="rounded-md border border-foreground/20 bg-background px-2 py-1 text-xs font-medium text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
                >
                  {selectableRoles.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              ) : (
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${roleBadgeColors[member.role]}`}
                >
                  <Icon size={12} />
                  {roleLabels[member.role]}
                </span>
              )}

              {canManage && !isOwner && !isSelf && (
                <>
                  {isConfirmingDelete ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDelete(member)}
                        disabled={isLoading}
                        className="rounded-md bg-danger px-2 py-1 text-xs font-medium text-white hover:opacity-90 disabled:opacity-50"
                      >
                        {isLoading ? '削除中...' : '確認'}
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        disabled={isLoading}
                        className="rounded-md border border-foreground/20 px-2 py-1 text-xs font-medium text-foreground hover:bg-foreground/5 disabled:opacity-50"
                      >
                        取消
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDeleteId(member.id)}
                      disabled={isLoading}
                      className="rounded-md p-1.5 text-foreground/40 hover:bg-danger/10 hover:text-danger disabled:opacity-50"
                      title="メンバーを削除"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
