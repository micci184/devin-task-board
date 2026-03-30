'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Kanban, List, Activity, Settings } from 'lucide-react'
import { useTranslations } from 'next-intl'

interface ProjectNavProps {
  projectId: string
}

const navKeys = [
  { key: 'board', icon: Kanban, href: (id: string) => `/projects/${id}/board` },
  { key: 'list', icon: List, href: (id: string) => `/projects/${id}/list` },
  { key: 'activity', icon: Activity, href: (id: string) => `/projects/${id}/activity` },
  { key: 'settings', icon: Settings, href: (id: string) => `/projects/${id}/settings` },
] as const

export const ProjectNav = ({ projectId }: ProjectNavProps) => {
  const pathname = usePathname()
  const t = useTranslations('projectNav')

  return (
    <nav className="flex gap-1 border-b border-foreground/10 pb-4">
      {navKeys.map((item) => {
        const href = item.href(projectId)
        const isActive = pathname === href || pathname.startsWith(href + '/')
        const Icon = item.icon

        return (
          <Link
            key={item.key}
            href={href}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              isActive
                ? 'bg-primary/10 text-primary'
                : 'text-foreground/50 hover:bg-foreground/5 hover:text-foreground'
            }`}
          >
            <Icon size={16} />
            {t(item.key)}
          </Link>
        )
      })}
    </nav>
  )
}
