'use client'

import { useState } from 'react'
import { Send } from 'lucide-react'

interface CommentFormProps {
  taskId: string
  onCommentAdded: () => void
}

export const CommentForm = ({ taskId, onCommentAdded }: CommentFormProps) => {
  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = content.trim()
    if (!trimmed) return

    setIsSubmitting(true)
    setError(null)

    try {
      const res = await fetch(`/api/tasks/${taskId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: trimmed }),
      })

      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error?.message ?? 'コメントの投稿に失敗しました')
      }

      setContent('')
      onCommentAdded()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'コメントの投稿に失敗しました')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Markdown でコメントを入力..."
        rows={3}
        maxLength={10000}
        disabled={isSubmitting}
        className="w-full rounded-md border border-foreground/20 bg-background px-3 py-2 text-sm text-foreground placeholder:text-foreground/40 outline-none focus:border-primary disabled:opacity-50"
      />
      {error && (
        <p className="text-xs text-danger">{error}</p>
      )}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting || !content.trim()}
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          <Send size={12} />
          {isSubmitting ? '投稿中...' : 'コメント'}
        </button>
      </div>
    </form>
  )
}
