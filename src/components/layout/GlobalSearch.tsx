'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, X, FileText } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

import type { Priority, TaskStatus } from '@prisma/client'

interface SearchTaskCategory {
  category: {
    id: string
    name: string
    color: string
  }
}

interface SearchTask {
  id: string
  taskNumber: number
  title: string
  description: string | null
  status: TaskStatus
  priority: Priority
  projectId: string
  dueDate: string | null
  project: {
    id: string
    name: string
    key: string
  }
  assignee: {
    id: string
    name: string
    avatarUrl: string | null
  } | null
  taskCategories: SearchTaskCategory[]
}

const priorityConfig: Record<Priority, { label: string; className: string }> = {
  URGENT: { label: '緊急', className: 'bg-danger/10 text-danger' },
  HIGH: { label: '高', className: 'bg-warning/10 text-warning' },
  MEDIUM: { label: '中', className: 'bg-primary/10 text-primary' },
  LOW: { label: '低', className: 'bg-foreground/10 text-foreground/60' },
  NONE: { label: '-', className: 'bg-foreground/5 text-foreground/40' },
}

const statusConfig: Record<TaskStatus, { label: string; className: string }> = {
  BACKLOG: { label: 'Backlog', className: 'bg-foreground/10 text-foreground/60' },
  TODO: { label: 'ToDo', className: 'bg-info/10 text-info' },
  IN_PROGRESS: { label: '進行中', className: 'bg-primary/10 text-primary' },
  IN_REVIEW: { label: 'レビュー', className: 'bg-warning/10 text-warning' },
  DONE: { label: '完了', className: 'bg-success/10 text-success' },
}

const highlightText = (text: string, query: string) => {
  if (!query.trim()) return text
  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`(${escapedQuery})`, 'gi')
  const parts = text.split(regex)

  return parts.map((part, i) => {
    if (part.toLowerCase() === query.toLowerCase()) {
      return (
        <mark key={i} className="rounded-sm bg-primary/20 px-0.5 text-foreground">
          {part}
        </mark>
      )
    }
    return part
  })
}

export const GlobalSearch = () => {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchTask[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([])
      setHasSearched(false)
      setIsLoading(false)
      return
    }

    // Abort any in-flight request before starting a new one
    if (abortRef.current) {
      abortRef.current.abort()
    }
    const controller = new AbortController()
    abortRef.current = controller

    setIsLoading(true)
    try {
      const res = await fetch(
        `/api/search?q=${encodeURIComponent(searchQuery.trim())}`,
        { signal: controller.signal },
      )
      if (res.ok) {
        const json = await res.json()
        setResults(json.data.tasks)
      } else {
        setResults([])
      }
      setHasSearched(true)
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        // Request was cancelled by a newer search — do nothing
        return
      }
      setResults([])
      setHasSearched(true)
    } finally {
      // Only clear loading if this controller is still the active one
      if (abortRef.current === controller) {
        setIsLoading(false)
      }
    }
  }, [])

  const handleInputChange = useCallback(
    (value: string) => {
      setQuery(value)
      setIsOpen(true)

      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }

      if (!value.trim()) {
        if (abortRef.current) {
          abortRef.current.abort()
          abortRef.current = null
        }
        setResults([])
        setHasSearched(false)
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      debounceRef.current = setTimeout(() => {
        performSearch(value)
      }, 300)
    },
    [performSearch],
  )

  const handleResultClick = useCallback(
    (task: SearchTask) => {
      setIsOpen(false)
      setQuery('')
      setResults([])
      setHasSearched(false)
      router.push(`/projects/${task.project.id}/tasks/${task.id}`)
    },
    [router],
  )

  const handleClear = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
      debounceRef.current = null
    }
    if (abortRef.current) {
      abortRef.current.abort()
      abortRef.current = null
    }
    setQuery('')
    setResults([])
    setHasSearched(false)
    setIsLoading(false)
    setIsOpen(false)
    inputRef.current?.focus()
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Clean up debounce and abort on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
      if (abortRef.current) {
        abortRef.current.abort()
      }
    }
  }, [])

  const showDropdown = isOpen && (query.trim().length > 0)

  return (
    <div ref={containerRef} className="relative hidden sm:block">
      <Search
        size={16}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40"
      />
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => handleInputChange(e.target.value)}
        onFocus={() => {
          if (query.trim()) setIsOpen(true)
        }}
        placeholder="検索..."
        className="h-8 w-64 rounded-md border border-foreground/10 bg-foreground/5 pl-9 pr-8 text-sm text-foreground placeholder:text-foreground/40 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
      />
      {query && (
        <button
          onClick={handleClear}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground"
          aria-label="検索をクリア"
        >
          <X size={14} />
        </button>
      )}

      {showDropdown && (
        <div className="absolute left-0 top-full z-50 mt-1 w-[480px] max-h-[400px] overflow-y-auto rounded-md border border-foreground/10 bg-background shadow-lg">
          {isLoading ? (
            <div className="p-3 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))}
            </div>
          ) : hasSearched && results.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-foreground/40">
              <Search size={24} className="mb-2" />
              <p className="text-sm">&quot;{query}&quot; に一致する結果はありません</p>
            </div>
          ) : results.length > 0 ? (
            <div className="py-1">
              <div className="px-3 py-1.5 text-xs font-medium text-foreground/40">
                {results.length}件の結果
              </div>
              {results.map((task) => (
                <button
                  key={task.id}
                  onClick={() => handleResultClick(task)}
                  className="flex w-full flex-col gap-1 px-3 py-2.5 text-left transition-colors hover:bg-foreground/5"
                >
                  <div className="flex items-center gap-2">
                    <span className="shrink-0 text-xs text-foreground/40">
                      {task.project.key}-{task.taskNumber}
                    </span>
                    <span className="truncate text-sm font-medium text-foreground">
                      {highlightText(task.title, query)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-foreground/50">
                      {task.project.name}
                    </span>
                    <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${statusConfig[task.status].className}`}>
                      {statusConfig[task.status].label}
                    </span>
                    {task.priority !== 'NONE' && (
                      <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${priorityConfig[task.priority].className}`}>
                        {priorityConfig[task.priority].label}
                      </span>
                    )}
                    {task.assignee && (
                      <span className="text-xs text-foreground/40">
                        {task.assignee.name}
                      </span>
                    )}
                  </div>
                  {task.description && task.description.toLowerCase().includes(query.toLowerCase()) && (
                    <div className="flex items-start gap-1 mt-0.5">
                      <FileText size={12} className="mt-0.5 shrink-0 text-foreground/30" />
                      <p className="text-xs text-foreground/50 line-clamp-1">
                        {highlightText(task.description.slice(0, 150), query)}
                      </p>
                    </div>
                  )}
                  {task.taskCategories.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-0.5">
                      {task.taskCategories.map((tc) => (
                        <span
                          key={tc.category.id}
                          className="rounded-full px-1.5 py-0.5 text-[10px] font-medium"
                          style={{
                            backgroundColor: `color-mix(in oklch, ${tc.category.color} 15%, transparent)`,
                            color: tc.category.color,
                          }}
                        >
                          {tc.category.name}
                        </span>
                      ))}
                    </div>
                  )}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}
