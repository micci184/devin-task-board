'use client'

import { useTheme } from 'next-themes'
import { signOut, useSession } from 'next-auth/react'
import { Sun, Moon, Monitor, Bell, Search, LogOut, Menu } from 'lucide-react'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  FolderKanban,
  Settings,
} from 'lucide-react'

const mobileNavItems = [
  { href: '/dashboard', label: 'ダッシュボード', icon: LayoutDashboard },
  { href: '/projects', label: 'プロジェクト', icon: FolderKanban },
  { href: '/notifications', label: '通知', icon: Bell },
  { href: '/settings/profile', label: '設定', icon: Settings },
]

const themeOptions = [
  { value: 'light', icon: Sun, label: 'ライト' },
  { value: 'dark', icon: Moon, label: 'ダーク' },
  { value: 'system', icon: Monitor, label: 'システム' },
] as const

export const Header = () => {
  const { theme, setTheme } = useTheme()
  const { data: session } = useSession()
  const pathname = usePathname()
  const [showThemeMenu, setShowThemeMenu] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showMobileNav, setShowMobileNav] = useState(false)

  return (
    <header className="flex h-14 items-center justify-between border-b border-foreground/10 bg-background px-4">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setShowMobileNav(!showMobileNav)}
          className="flex h-8 w-8 items-center justify-center rounded-md text-foreground/60 hover:bg-foreground/5 hover:text-foreground md:hidden"
          aria-label="メニュー"
        >
          <Menu size={18} />
        </button>

        <div className="relative hidden sm:block">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" />
          <input
            type="text"
            placeholder="検索..."
            disabled
            className="h-8 w-64 rounded-md border border-foreground/10 bg-foreground/5 pl-9 pr-3 text-sm text-foreground placeholder:text-foreground/40 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Link
          href="/notifications"
          className="relative flex h-8 w-8 items-center justify-center rounded-md text-foreground/60 hover:bg-foreground/5 hover:text-foreground"
          aria-label="通知"
        >
          <Bell size={18} />
        </Link>

        <div className="relative">
          <button
            onClick={() => {
              setShowThemeMenu(!showThemeMenu)
              setShowUserMenu(false)
            }}
            className="flex h-8 w-8 items-center justify-center rounded-md text-foreground/60 hover:bg-foreground/5 hover:text-foreground"
            aria-label="テーマ切替"
          >
            {theme === 'dark' ? <Moon size={18} /> : theme === 'light' ? <Sun size={18} /> : <Monitor size={18} />}
          </button>

          {showThemeMenu && (
            <div className="absolute right-0 top-full z-50 mt-1 w-36 rounded-md border border-foreground/10 bg-background py-1 shadow-lg">
              {themeOptions.map((option) => {
                const Icon = option.icon
                return (
                  <button
                    key={option.value}
                    onClick={() => {
                      setTheme(option.value)
                      setShowThemeMenu(false)
                    }}
                    className={`flex w-full items-center gap-2 px-3 py-1.5 text-sm transition-colors ${
                      theme === option.value
                        ? 'text-primary'
                        : 'text-foreground/60 hover:bg-foreground/5 hover:text-foreground'
                    }`}
                  >
                    <Icon size={14} />
                    <span>{option.label}</span>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => {
              setShowUserMenu(!showUserMenu)
              setShowThemeMenu(false)
            }}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground"
            aria-label="ユーザーメニュー"
          >
            {session?.user?.name?.charAt(0).toUpperCase() ?? '?'}
          </button>

          {showUserMenu && (
            <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-md border border-foreground/10 bg-background py-1 shadow-lg">
              <div className="border-b border-foreground/10 px-3 py-2">
                <p className="text-sm font-medium text-foreground truncate">
                  {session?.user?.name ?? 'ユーザー'}
                </p>
                <p className="text-xs text-foreground/60 truncate">
                  {session?.user?.email ?? ''}
                </p>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-foreground/60 hover:bg-foreground/5 hover:text-foreground"
              >
                <LogOut size={14} />
                <span>ログアウト</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {showMobileNav && (
        <div className="absolute left-0 top-14 z-50 w-full border-b border-foreground/10 bg-background p-2 shadow-lg md:hidden">
          <nav className="space-y-1">
            {mobileNavItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
              const Icon = item.icon

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setShowMobileNav(false)}
                  className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                    isActive
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-foreground/60 hover:bg-foreground/5 hover:text-foreground'
                  }`}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>
        </div>
      )}
    </header>
  )
}
