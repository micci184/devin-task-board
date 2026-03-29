'use client'

import { useActionState, useEffect } from 'react'

import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { updateProject } from '@/lib/actions/project'

import type { ProjectActionState } from '@/lib/actions/project'

interface ProjectSettingsFormProps {
  projectId: string
  defaultName: string
  defaultDescription: string
}

export const ProjectSettingsForm = ({
  projectId,
  defaultName,
  defaultDescription,
}: ProjectSettingsFormProps) => {
  const [state, formAction, isPending] = useActionState<
    ProjectActionState | null,
    FormData
  >(updateProject, null)

  useEffect(() => {
    if (state?.success) {
      toast.success('プロジェクトを更新しました')
    }
    if (state?.error) {
      toast.error(state.error)
    }
  }, [state])

  return (
    <form action={formAction} className="space-y-6">
      <div className="rounded-lg border border-foreground/10 p-6">
        <h2 className="mb-4 text-lg font-semibold text-foreground">基本情報</h2>

        <input type="hidden" name="projectId" value={projectId} />

        <div className="space-y-4">
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
              defaultValue={defaultName}
              className="w-full rounded-md border border-foreground/10 bg-background px-3 py-2 text-sm text-foreground placeholder:text-foreground/40 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
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
              defaultValue={defaultDescription}
              className="w-full rounded-md border border-foreground/10 bg-background px-3 py-2 text-sm text-foreground placeholder:text-foreground/40 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {isPending && <Loader2 size={14} className="animate-spin" />}
            {isPending ? '保存中...' : '変更を保存'}
          </button>
        </div>
      </div>
    </form>
  )
}
