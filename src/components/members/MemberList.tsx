'use client'

import { Crown, Shield, User, Eye } from 'lucide-react'

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

export const MemberList = ({ members }: MemberListProps) => {
  return (
    <div className="divide-y divide-foreground/10 rounded-lg border border-foreground/10">
      {members.map((member) => {
        const Icon = roleIcons[member.role]
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
                <p className="text-sm font-medium text-foreground">{member.user.name}</p>
                <p className="text-xs text-foreground/60">{member.user.email}</p>
              </div>
            </div>

            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${roleBadgeColors[member.role]}`}
            >
              <Icon size={12} />
              {roleLabels[member.role]}
            </span>
          </div>
        )
      })}
    </div>
  )
}
