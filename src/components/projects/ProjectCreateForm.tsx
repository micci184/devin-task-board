'use client'

import { useActionState, useState, useEffect } from 'react'
import Link from 'next/link'

import { ArrowLeft, Loader2, Key } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'

import { createProject } from '@/lib/actions/project'

import type { ProjectActionState } from '@/lib/actions/project'

const generateProjectKeyPreview = (name: string): string => {
  const trimmed = name.trim()
  if (!trimmed) return ''
  const words = trimmed.split(/\s+/)
  if (words.length === 1) {
    return words[0].substring(0, 3).toUpperCase()
  }
  return words
    .map((w) => w.charAt(0))
    .join('')
    .toUpperCase()
    .substring(0, 5)
}

export const ProjectCreateForm = () => {
  const t = useTranslations('projects')
  const tCommon = useTranslations('common')
  const [state, formAction, isPending] = useActionState<
    ProjectActionState | null,
    FormData
  >(createProject, null)
  const [projectName, setProjectName] = useState('')
  const keyPreview = generateProjectKeyPreview(projectName)

  useEffect(() => {
    if (state?.error) {
      toast.error(state.error)
    }
  }, [state])

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
          {t('projectName')} <span className="text-danger">*</span>
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          placeholder="例: Devin Task Board"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          className="w-full rounded-md border border-foreground/10 bg-background px-3 py-2 text-sm text-foreground placeholder:text-foreground/40 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <div className="flex items-center gap-2 text-xs text-foreground/50">
          <span>{t('autoGenerateKey')}</span>
          {keyPreview && (
            <span className="inline-flex items-center gap-1 rounded bg-primary/10 px-2 py-0.5 font-mono text-xs font-semibold text-primary">
              <Key size={12} />
              {keyPreview}
            </span>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <label
          htmlFor="description"
          className="block text-sm font-medium text-foreground"
        >
          {tCommon('description')}
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
          {t('backToList')}
        </Link>
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          {isPending && <Loader2 size={14} className="animate-spin" />}
          {isPending ? tCommon('creating') : t('createProject')}
        </button>
      </div>
    </form>
  )
}
