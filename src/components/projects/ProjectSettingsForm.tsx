'use client'

import { useActionState, useEffect } from 'react'

import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'

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
  const t = useTranslations('projects')
  const tCommon = useTranslations('common')
  const [state, formAction, isPending] = useActionState<
    ProjectActionState | null,
    FormData
  >(updateProject, null)

  useEffect(() => {
    if (state?.success) {
      toast.success(t('updateSuccess'))
    }
    if (state?.error) {
      toast.error(state.error)
    }
  }, [state])

  return (
    <form action={formAction} className="space-y-6">
      <div className="rounded-lg border border-foreground/10 p-6">
        <h2 className="mb-4 text-lg font-semibold text-foreground">{t('basicInfo')}</h2>

        <input type="hidden" name="projectId" value={projectId} />

        <div className="space-y-4">
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
              defaultValue={defaultName}
              className="w-full rounded-md border border-foreground/10 bg-background px-3 py-2 text-sm text-foreground placeholder:text-foreground/40 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
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
            {isPending ? tCommon('saving') : tCommon('save')}
          </button>
        </div>
      </div>
    </form>
  )
}
