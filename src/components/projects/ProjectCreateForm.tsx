'use client'

import { useActionState } from 'react'
import Link from 'next/link'

import { ArrowLeft, Loader2 } from 'lucide-react'

import { createProject } from '@/lib/actions/project'

import type { ProjectActionState } from '@/lib/actions/project'

export const ProjectCreateForm = () => {
  const [state, formAction, isPending] = useActionState<
    ProjectActionState | null,
    FormData
  >(createProject, null)

  return (
    <form action={formAction} className="space-y-6">
      {state?.error && (
        <div className="rounded-md border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
          {state.error}
        </div>
      )}

      <div className="space-y-2">
        <label
          htmlFor="name"
          className="block text-sm font-medium text-foreground"
        >
          プロジェクト名 <span className="text-danger">*</span>
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          placeholder="例: Devin Task Board"
          className="w-full rounded-md border border-foreground/10 bg-background px-3 py-2 text-sm text-foreground placeholder:text-foreground/40 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <p className="text-xs text-foreground/50">
          プロジェクトキーが自動生成されます
        </p>
      </div>

      <div className="space-y-2">
        <label
          htmlFor="description"
          className="block text-sm font-medium text-foreground"
        >
          説明
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          placeholder="プロジェクトの説明を入力..."
          className="w-full rounded-md border border-foreground/10 bg-background px-3 py-2 text-sm text-foreground placeholder:text-foreground/40 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      <div className="flex items-center justify-between border-t border-foreground/10 pt-6">
        <Link
          href="/projects"
          className="inline-flex items-center gap-1 text-sm text-foreground/60 hover:text-foreground"
        >
          <ArrowLeft size={14} />
          一覧に戻る
        </Link>
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          {isPending && <Loader2 size={14} className="animate-spin" />}
          {isPending ? '作成中...' : 'プロジェクトを作成'}
        </button>
      </div>
    </form>
  )
}
