'use client'

import { useState } from 'react'

import { Trash2, Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { deleteProject } from '@/lib/actions/project'

interface ProjectDeleteSectionProps {
  projectId: string
  projectName: string
}

export const ProjectDeleteSection = ({
  projectId,
  projectName,
}: ProjectDeleteSectionProps) => {
  const t = useTranslations('projects')
  const tCommon = useTranslations('common')
  const [showDialog, setShowDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleDelete = async () => {
    setIsDeleting(true)
    setError(null)
    try {
      const result = await deleteProject(projectId)
      if (result?.error) {
        setError(result.error)
        setIsDeleting(false)
      }
    } catch {
      setError(tCommon('unexpectedError'))
      setIsDeleting(false)
    }
  }

  return (
    <>
      <div className="rounded-lg border border-danger/30 p-6">
        <h2 className="mb-2 text-lg font-semibold text-danger">{t('dangerZone')}</h2>
        <p className="mb-4 text-sm text-foreground/60">
          {t('deleteWarning')}
        </p>
        <button
          onClick={() => setShowDialog(true)}
          className="inline-flex items-center gap-2 rounded-md border border-danger/30 bg-danger/10 px-4 py-2 text-sm font-medium text-danger transition-colors hover:bg-danger/20"
        >
          <Trash2 size={14} />
          {t('deleteProject')}
        </button>
      </div>

      {showDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50">
          <div className="mx-4 w-full max-w-md rounded-lg bg-background p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-foreground">
              {t('deleteProject')}
            </h3>
            <p className="mt-2 text-sm text-foreground/60">
              {t('deleteConfirm', { name: projectName })}
            </p>
            <p className="mt-3 text-sm text-foreground/60">
              {t('deleteConfirmInput')}
            </p>
            {error && (
              <div className="mt-3 rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
                {error}
              </div>
            )}
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={projectName}
              className="mt-2 w-full rounded-md border border-foreground/10 bg-background px-3 py-2 text-sm text-foreground placeholder:text-foreground/40 focus:border-danger focus:outline-none focus:ring-1 focus:ring-danger"
            />
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDialog(false)
                  setConfirmText('')
                  setError(null)
                }}
                className="rounded-md border border-foreground/10 px-4 py-2 text-sm font-medium text-foreground/60 transition-colors hover:bg-foreground/5"
              >
                {tCommon('cancel')}
              </button>
              <button
                onClick={handleDelete}
                disabled={confirmText !== projectName || isDeleting}
                className="inline-flex items-center gap-2 rounded-md bg-danger px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-danger/90 disabled:opacity-50"
              >
                {isDeleting && <Loader2 size={14} className="animate-spin" />}
                {isDeleting ? tCommon('deleting') : tCommon('delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
