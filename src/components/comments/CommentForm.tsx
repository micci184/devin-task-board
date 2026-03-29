'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Send } from 'lucide-react'

interface MentionUser {
  id: string
  name: string
  avatarUrl: string | null
}

interface CommentFormProps {
  taskId: string
  projectId: string
  onCommentAdded: () => void
}

export const CommentForm = ({ taskId, projectId, onCommentAdded }: CommentFormProps) => {
  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // メンションサジェスト状態
  const [showSuggest, setShowSuggest] = useState(false)
  const [suggestUsers, setSuggestUsers] = useState<MentionUser[]>([])
  const [suggestIndex, setSuggestIndex] = useState(0)
  const [mentionQuery, setMentionQuery] = useState('')
  const [mentionStart, setMentionStart] = useState<number | null>(null)

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const suggestRef = useRef<HTMLDivElement>(null)

  const fetchSuggest = useCallback(async (query: string) => {
    try {
      const res = await fetch(
        `/api/projects/${projectId}/members/suggest?q=${encodeURIComponent(query)}`,
      )
      if (!res.ok) return
      const json = await res.json()
      setSuggestUsers(json.data)
      setSuggestIndex(0)
    } catch {
      // ignore
    }
  }, [projectId])

  useEffect(() => {
    if (!showSuggest) return
    const timer = setTimeout(() => fetchSuggest(mentionQuery), 150)
    return () => clearTimeout(timer)
  }, [mentionQuery, showSuggest, fetchSuggest])

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    setContent(value)

    const cursorPos = e.target.selectionStart
    const textBeforeCursor = value.substring(0, cursorPos)

    // `@` の直後のテキストを検出
    const atMatch = textBeforeCursor.match(/@([^\s@]*)$/)
    if (atMatch) {
      setShowSuggest(true)
      setMentionQuery(atMatch[1])
      setMentionStart(cursorPos - atMatch[0].length)
    } else {
      setShowSuggest(false)
      setMentionQuery('')
      setMentionStart(null)
    }
  }

  const insertMention = (user: MentionUser) => {
    if (mentionStart === null || !textareaRef.current) return

    const before = content.substring(0, mentionStart)
    const after = content.substring(textareaRef.current.selectionStart)
    const newContent = `${before}@${user.name} ${after}`
    setContent(newContent)
    setShowSuggest(false)
    setMentionQuery('')
    setMentionStart(null)

    requestAnimationFrame(() => {
      if (textareaRef.current) {
        const pos = before.length + user.name.length + 2
        textareaRef.current.selectionStart = pos
        textareaRef.current.selectionEnd = pos
        textareaRef.current.focus()
      }
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!showSuggest || suggestUsers.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSuggestIndex((prev) => (prev + 1) % suggestUsers.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSuggestIndex((prev) => (prev - 1 + suggestUsers.length) % suggestUsers.length)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      insertMention(suggestUsers[suggestIndex])
    } else if (e.key === 'Escape') {
      setShowSuggest(false)
    }
  }

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
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Markdown でコメントを入力... @でメンション"
          rows={3}
          maxLength={10000}
          disabled={isSubmitting}
          className="w-full rounded-md border border-foreground/20 bg-background px-3 py-2 text-sm text-foreground placeholder:text-foreground/40 outline-none focus:border-primary disabled:opacity-50"
        />
        {showSuggest && suggestUsers.length > 0 && (
          <div
            ref={suggestRef}
            className="absolute left-0 bottom-full z-50 mb-1 w-64 rounded-md border border-foreground/10 bg-background py-1 shadow-lg"
          >
            {suggestUsers.map((user, index) => (
              <button
                key={user.id}
                type="button"
                onClick={() => insertMention(user)}
                className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm hover:bg-foreground/5 ${
                  index === suggestIndex ? 'bg-foreground/5' : ''
                }`}
              >
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-medium text-primary">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <span className="truncate text-foreground">{user.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>
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
