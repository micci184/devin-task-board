'use client'

import { useState, useEffect, useCallback } from 'react'
import { format } from 'date-fns'
import { ja, enUS } from 'date-fns/locale'
import { Pencil, Trash2, Check, X } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { toast } from 'sonner'

import { MarkdownPreview } from '@/components/tasks/MarkdownPreview'
import { CommentForm } from '@/components/comments/CommentForm'

interface CommentAuthor {
  id: string
  name: string
  avatarUrl: string | null
}

interface CommentData {
  id: string
  content: string
  taskId: string
  authorId: string
  createdAt: string
  updatedAt: string
  author: CommentAuthor
}

interface CommentListProps {
  taskId: string
  projectId: string
  currentUserId: string
  canEdit: boolean
}

const CommentItem = ({
  comment,
  currentUserId,
  onUpdated,
  onDeleted,
}: {
  comment: CommentData
  currentUserId: string
  onUpdated: (comment: CommentData) => void
  onDeleted: (commentId: string) => void
}) => {
  const t = useTranslations('comments')
  const tCommon = useTranslations('common')
  const locale = useLocale()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(comment.content)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const isOwner = comment.authorId === currentUserId
  const isEdited = comment.createdAt !== comment.updatedAt

  const handleSave = async () => {
    const trimmed = draft.trim()
    if (!trimmed || trimmed === comment.content) {
      setDraft(comment.content)
      setEditing(false)
      return
    }

    setIsSaving(true)
    try {
      const res = await fetch(`/api/comments/${comment.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: trimmed }),
      })

      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error?.message ?? t('editError'))
      }

      const json = await res.json()
      onUpdated(json.data)
      toast.success(t('editSuccess'))
      setEditing(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('editError'))
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/comments/${comment.id}`, {
        method: 'DELETE',
      })

      if (!res.ok && res.status !== 204) {
        const json = await res.json()
        throw new Error(json.error?.message ?? t('deleteError'))
      }

      onDeleted(comment.id)
      toast.success(t('deleteSuccess'))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('deleteError'))
      setIsDeleting(false)
    }
  }

  const handleCancel = () => {
    setDraft(comment.content)
    setEditing(false)
  }

  return (
    <div className="flex gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-medium text-primary">
        {comment.author.name.charAt(0).toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">{comment.author.name}</span>
          <span className="text-xs text-foreground/40">
            {format(new Date(comment.createdAt), 'yyyy/MM/dd HH:mm', { locale: locale === 'ja' ? ja : enUS })}
          </span>
          {isEdited && (
            <span className="text-xs text-foreground/30">({t('edited')})</span>
          )}
          {isOwner && !editing && (
            <div className="ml-auto flex items-center gap-1">
              <button
                onClick={() => setEditing(true)}
                className="rounded p-1 text-foreground/30 transition-colors hover:bg-foreground/5 hover:text-foreground/60"
                title={tCommon('edit')}
              >
                <Pencil size={12} />
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="rounded p-1 text-foreground/30 transition-colors hover:bg-danger/10 hover:text-danger disabled:opacity-50"
                title={tCommon('delete')}
              >
                <Trash2 size={12} />
              </button>
            </div>
          )}
        </div>

        {editing ? (
          <div className="mt-2 space-y-2">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="w-full rounded-md border border-foreground/20 bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
              rows={4}
              maxLength={10000}
              disabled={isSaving}
            />
            <div className="flex items-center gap-2">
              <button
                onClick={handleSave}
                disabled={isSaving || !draft.trim()}
                className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                <Check size={12} />
                {isSaving ? tCommon('saving') : tCommon('save')}
              </button>
              <button
                onClick={handleCancel}
                disabled={isSaving}
                className="inline-flex items-center gap-1 rounded-md border border-foreground/20 px-3 py-1.5 text-xs font-medium text-foreground/60 hover:bg-foreground/5 disabled:opacity-50"
              >
                <X size={12} />
                {tCommon('cancel')}
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-1">
            <MarkdownPreview content={comment.content} highlightMentions />
          </div>
        )}
      </div>
    </div>
  )
}

export const CommentList = ({ taskId, projectId, currentUserId, canEdit }: CommentListProps) => {
  const t = useTranslations('comments')
  const [comments, setComments] = useState<CommentData[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchComments = useCallback(async () => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/comments`)
      if (!res.ok) return
      const json = await res.json()
      setComments(json.data)
    } catch {
      // ignore
    } finally {
      setIsLoading(false)
    }
  }, [taskId])

  useEffect(() => {
    fetchComments()
  }, [fetchComments])

  const handleCommentUpdated = (updated: CommentData) => {
    setComments((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
  }

  const handleCommentDeleted = (commentId: string) => {
    setComments((prev) => prev.filter((c) => c.id !== commentId))
  }

  const handleCommentAdded = () => {
    fetchComments()
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="flex gap-3 animate-pulse">
            <div className="h-8 w-8 rounded-full bg-foreground/10" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-32 rounded bg-foreground/10" />
              <div className="h-12 rounded bg-foreground/10" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {comments.length === 0 ? (
        <p className="text-sm text-foreground/40">{t('empty')}</p>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              currentUserId={currentUserId}
              onUpdated={handleCommentUpdated}
              onDeleted={handleCommentDeleted}
            />
          ))}
        </div>
      )}

      {canEdit && (
        <div className="border-t border-foreground/10 pt-4">
          <CommentForm taskId={taskId} projectId={projectId} onCommentAdded={handleCommentAdded} />
        </div>
      )}
    </div>
  )
}
