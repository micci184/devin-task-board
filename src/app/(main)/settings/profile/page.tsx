"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import type { Locale } from "@/i18n/config";

interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  locale: string;
  theme: string;
}

const ProfileSettingsPage = () => {
  const t = useTranslations("settings");
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [name, setName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [locale, setLocale] = useState<Locale>("ja");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch("/api/users/me");
        if (!res.ok) return;
        const json = (await res.json()) as { data: UserProfile };
        setProfile(json.data);
        setName(json.data.name);
        setAvatarUrl(json.data.avatarUrl ?? "");
        setLocale(json.data.locale as Locale);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          avatarUrl: avatarUrl.trim() || null,
          locale,
        }),
      });

      if (!res.ok) {
        toast.error(t("saveError"));
        return;
      }

      toast.success(t("saveSuccess"));
      router.refresh();
    } catch {
      toast.error(t("saveError"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8 p-6">
      <h1 className="text-xl font-bold text-foreground">{t("title")}</h1>

      <section className="space-y-6 rounded-lg border border-foreground/10 bg-background p-6">
        <h2 className="text-sm font-semibold text-foreground">
          {t("profileSection")}
        </h2>

        {/* 表示名 */}
        <div className="space-y-1.5">
          <label
            htmlFor="name"
            className="text-sm font-medium text-foreground/70"
          >
            {t("name")}
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-9 w-full rounded-md border border-foreground/10 bg-foreground/5 px-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* メールアドレス（読み取り専用） */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground/70">
            {t("email")}
          </label>
          <input
            type="text"
            value={profile?.email ?? ""}
            disabled
            className="h-9 w-full rounded-md border border-foreground/10 bg-foreground/5 px-3 text-sm text-foreground/50 cursor-not-allowed"
          />
        </div>

        {/* アバターURL */}
        <div className="space-y-1.5">
          <label
            htmlFor="avatarUrl"
            className="text-sm font-medium text-foreground/70"
          >
            {t("avatarUrl")}
          </label>
          <input
            id="avatarUrl"
            type="text"
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
            placeholder={t("avatarUrlPlaceholder")}
            className="h-9 w-full rounded-md border border-foreground/10 bg-foreground/5 px-3 text-sm text-foreground placeholder:text-foreground/40 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* 言語設定 */}
        <div className="space-y-1.5">
          <label
            htmlFor="locale"
            className="text-sm font-medium text-foreground/70"
          >
            {t("language")}
          </label>
          <p className="text-xs text-foreground/50">
            {t("languageDescription")}
          </p>
          <select
            id="locale"
            value={locale}
            onChange={(e) => setLocale(e.target.value as Locale)}
            className="h-9 w-full rounded-md border border-foreground/10 bg-foreground/5 px-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="ja">{t("japanese")}</option>
            <option value="en">{t("english")}</option>
          </select>
        </div>
      </section>

      <button
        onClick={handleSave}
        disabled={saving || !name.trim()}
        className="h-9 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {saving ? t("saving") : t("save")}
      </button>
    </div>
  );
};

export default ProfileSettingsPage;
