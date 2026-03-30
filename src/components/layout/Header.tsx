"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

import { useTheme } from "next-themes";
import { signOut, useSession } from "next-auth/react";
import type { Theme } from "@prisma/client";
import {
  Sun,
  Moon,
  Monitor,
  Bell,
  LogOut,
  Menu,
  LayoutDashboard,
  FolderKanban,
  Settings,
} from "lucide-react";
import { GlobalSearch } from "@/components/layout/GlobalSearch";
import { NotificationBell } from "@/components/notifications/NotificationBell";

const mobileNavKeys = [
  { href: "/dashboard", key: "dashboard", icon: LayoutDashboard },
  { href: "/projects", key: "projects", icon: FolderKanban },
  { href: "/notifications", key: "notifications", icon: Bell },
  { href: "/settings/profile", key: "settings", icon: Settings },
];

const themeOptionKeys = [
  { value: "light", icon: Sun, key: "light" },
  { value: "dark", icon: Moon, key: "dark" },
  { value: "system", icon: Monitor, key: "system" },
] as const;

export const Header = () => {
  const { theme, setTheme } = useTheme();
  const { data: session } = useSession();
  const pathname = usePathname();
  const tNav = useTranslations("nav");
  const tTheme = useTranslations("theme");
  const tAuth = useTranslations("auth");
  const tCommon = useTranslations("common");
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileNav, setShowMobileNav] = useState(false);
  const themeMenuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        themeMenuRef.current &&
        !themeMenuRef.current.contains(e.target as Node)
      ) {
        setShowThemeMenu(false);
      }
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(e.target as Node)
      ) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="relative flex h-14 items-center justify-between border-b border-foreground/10 bg-background px-4">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setShowMobileNav(!showMobileNav)}
          className="flex h-8 w-8 items-center justify-center rounded-md text-foreground/60 hover:bg-foreground/5 hover:text-foreground md:hidden"
          aria-label={tNav("menu")}
        >
          <Menu size={18} />
        </button>

        <GlobalSearch />
      </div>

      <div className="flex items-center gap-2">
        <NotificationBell />

        <div ref={themeMenuRef} className="relative">
          <button
            onClick={() => {
              setShowThemeMenu(!showThemeMenu);
              setShowUserMenu(false);
            }}
            className="flex h-8 w-8 items-center justify-center rounded-md text-foreground/60 hover:bg-foreground/5 hover:text-foreground"
            aria-label={tNav("themeToggle")}
          >
            {theme === "dark" ? (
              <Moon size={18} />
            ) : theme === "light" ? (
              <Sun size={18} />
            ) : (
              <Monitor size={18} />
            )}
          </button>

          {showThemeMenu && (
            <div className="absolute right-0 top-full z-50 mt-1 w-36 rounded-md border border-foreground/10 bg-background py-1 shadow-lg">
              {themeOptionKeys.map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.value}
                      onClick={() => {
                        setTheme(option.value);
                        setShowThemeMenu(false);
                        fetch("/api/users/me", {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ theme: option.value.toUpperCase() as Theme }),
                        }).catch(() => {});
                      }}
                    className={`flex w-full items-center gap-2 px-3 py-1.5 text-sm transition-colors ${
                      theme === option.value
                        ? "text-primary"
                        : "text-foreground/60 hover:bg-foreground/5 hover:text-foreground"
                    }`}
                  >
                    <Icon size={14} />
                    <span>{tTheme(option.key)}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div ref={userMenuRef} className="relative">
          <button
            onClick={() => {
              setShowUserMenu(!showUserMenu);
              setShowThemeMenu(false);
            }}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground"
            aria-label={tNav("userMenu")}
          >
            {session?.user?.name?.charAt(0).toUpperCase() ?? "?"}
          </button>

          {showUserMenu && (
            <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-md border border-foreground/10 bg-background py-1 shadow-lg">
              <div className="border-b border-foreground/10 px-3 py-2">
                <p className="text-sm font-medium text-foreground truncate">
                  {session?.user?.name ?? tCommon("user")}
                </p>
                <p className="text-xs text-foreground/60 truncate">
                  {session?.user?.email ?? ""}
                </p>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-foreground/60 hover:bg-foreground/5 hover:text-foreground"
              >
                <LogOut size={14} />
                <span>{tAuth("logout")}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {showMobileNav && (
        <div className="absolute left-0 top-14 z-50 w-full border-b border-foreground/10 bg-background p-2 shadow-lg md:hidden">
          <nav className="space-y-1">
            {mobileNavKeys.map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(item.href + "/");
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setShowMobileNav(false)}
                  className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                    isActive
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-foreground/60 hover:bg-foreground/5 hover:text-foreground"
                  }`}
                >
                  <Icon size={18} />
                  <span>{tNav(item.key)}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
};
