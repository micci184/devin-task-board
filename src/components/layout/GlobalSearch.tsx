'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, X, FileText, SlidersHorizontal, Calendar, ChevronDown } from 'lucide-react'
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

interface FilterAssignee {
  id: string
  name: string
  avatarUrl: string | null
}

interface FilterCategory {
  id: string
  name: string
  color: string
  projectId: string
}

interface SearchFilters {
  status: TaskStatus[]
  priority: Priority[]
  assigneeId: string | null
  categoryId: string[]
  dueDateFrom: string
  dueDateTo: string
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

const ALL_STATUSES: TaskStatus[] = ['BACKLOG', 'TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE']
const ALL_PRIORITIES: Priority[] = ['URGENT', 'HIGH', 'MEDIUM', 'LOW', 'NONE']

const emptyFilters: SearchFilters = {
  status: [],
  priority: [],
  assigneeId: null,
  categoryId: [],
  dueDateFrom: '',
  dueDateTo: '',
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

const hasActiveFilters = (f: SearchFilters) =>
  f.status.length > 0 ||
  f.priority.length > 0 ||
  f.assigneeId !== null ||
  f.categoryId.length > 0 ||
  f.dueDateFrom !== '' ||
  f.dueDateTo !== ''

/** チェックボックス付きマルチセレクトドロップダウン */
const MultiSelectDropdown = <T extends string>({
  label,
  options,
  selected,
  onChange,
  renderOption,
}: {
  label: string
  options: T[]
  selected: T[]
  onChange: (val: T[]) => void
  renderOption: (opt: T) => React.ReactNode
}) => {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex h-8 w-full items-center justify-between gap-1 rounded-md border border-foreground/10 bg-foreground/5 px-2.5 text-xs text-foreground hover:border-foreground/20"
      >
        <span className="truncate">
          {selected.length === 0 ? label : `${label} (${selected.length})`}
        </span>
        <ChevronDown size={12} className="shrink-0 text-foreground/40" />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-[60] mt-1 max-h-48 w-full min-w-[160px] overflow-y-auto rounded-md border border-foreground/10 bg-background shadow-lg">
          {options.map((opt) => (
            <label
              key={opt}
              className="flex cursor-pointer items-center gap-2 px-2.5 py-1.5 text-xs hover:bg-foreground/5"
            >
              <input
                type="checkbox"
                checked={selected.includes(opt)}
                onChange={() => {
                  onChange(
                    selected.includes(opt)
                      ? selected.filter((s) => s !== opt)
                      : [...selected, opt],
                  )
                }}
                className="h-3.5 w-3.5 rounded border-foreground/20 accent-primary"
              />
              {renderOption(opt)}
            </label>
          ))}
        </div>
      )}
    </div>
  )
}

export const GlobalSearch = () => {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchTask[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<SearchFilters>({ ...emptyFilters })
  const [assignees, setAssignees] = useState<FilterAssignee[]>([])
  const [categories, setCategories] = useState<FilterCategory[]>([])
  const [optionsLoaded, setOptionsLoaded] = useState(false)

  const [filterPanelHeight, setFilterPanelHeight] = useState(0)

  const containerRef = useRef<HTMLDivElement>(null)
  const filterPanelRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  /** フィルター選択肢をフェッチ */
  const loadOptions = useCallback(async () => {
    if (optionsLoaded) return
    try {
      const res = await fetch('/api/search/options')
      if (!res.ok) return
      const json = await res.json()
      setAssignees(json.data.assignees)
      setCategories(json.data.categories)
      setOptionsLoaded(true)
    } catch {
      // ignore – don't set optionsLoaded so next toggle retries
    }
  }, [optionsLoaded])

  /** フィルターパラメータをクエリ文字列に変換 */
  const buildFilterParams = useCallback((f: SearchFilters) => {
    const params = new URLSearchParams()
    if (f.status.length > 0) params.set('status', f.status.join(','))
    if (f.priority.length > 0) params.set('priority', f.priority.join(','))
    if (f.assigneeId) params.set('assigneeId', f.assigneeId)
    if (f.categoryId.length > 0) params.set('categoryId', f.categoryId.join(','))
    if (f.dueDateFrom) params.set('dueDateFrom', f.dueDateFrom)
    if (f.dueDateTo) params.set('dueDateTo', f.dueDateTo)
    return params.toString()
  }, [])

  const performSearch = useCallback(
    async (searchQuery: string, currentFilters: SearchFilters) => {
      if (!searchQuery.trim()) {
        setResults([])
        setHasSearched(false)
        setIsLoading(false)
        return
      }

      if (abortRef.current) {
        abortRef.current.abort()
      }
      const controller = new AbortController()
      abortRef.current = controller

      setIsLoading(true)
      try {
        const filterStr = buildFilterParams(currentFilters)
        const url = `/api/search?q=${encodeURIComponent(searchQuery.trim())}${filterStr ? `&${filterStr}` : ''}`
        const res = await fetch(url, { signal: controller.signal })
        if (res.ok) {
          const json = await res.json()
          setResults(json.data.tasks)
        } else {
          setResults([])
        }
        setHasSearched(true)
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          return
        }
        setResults([])
        setHasSearched(true)
      } finally {
        if (abortRef.current === controller) {
          setIsLoading(false)
        }
      }
    },
    [buildFilterParams],
  )

  const scheduleSearch = useCallback(
    (value: string, currentFilters: SearchFilters) => {
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
        performSearch(value, currentFilters)
      }, 300)
    },
    [performSearch],
  )

  const handleInputChange = useCallback(
    (value: string) => {
      setQuery(value)
      setIsOpen(true)
      scheduleSearch(value, filters)
    },
    [scheduleSearch, filters],
  )

  const handleFilterChange = useCallback(
    (newFilters: SearchFilters) => {
      setFilters(newFilters)
      if (query.trim()) {
        scheduleSearch(query, newFilters)
      }
    },
    [query, scheduleSearch],
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

  const handleClearFilters = useCallback(() => {
    const cleared = { ...emptyFilters }
    setFilters(cleared)
    if (query.trim()) {
      scheduleSearch(query, cleared)
    }
  }, [query, scheduleSearch])

  const toggleFilters = useCallback(() => {
    const next = !showFilters
    setShowFilters(next)
    if (next) loadOptions()
  }, [showFilters, loadOptions])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
        setShowFilters(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // フィルターパネルの高さを計測（DOM コミット後に同期的に取得）
  useLayoutEffect(() => {
    if (showFilters && filterPanelRef.current) {
      setFilterPanelHeight(filterPanelRef.current.offsetHeight)
    } else {
      setFilterPanelHeight(0)
    }
  }, [showFilters, filters, assignees, categories])

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

  const showDropdown = isOpen && query.trim().length > 0
  const activeFilterCount =
    filters.status.length +
    filters.priority.length +
    (filters.assigneeId ? 1 : 0) +
    filters.categoryId.length +
    (filters.dueDateFrom ? 1 : 0) +
    (filters.dueDateTo ? 1 : 0)

  return (
    <div ref={containerRef} className="relative hidden sm:block">
      <div className="flex items-center gap-1">
        <div className="relative">
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
        </div>
        <button
          onClick={toggleFilters}
          className={`relative flex h-8 w-8 items-center justify-center rounded-md border transition-colors ${
            showFilters || hasActiveFilters(filters)
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-foreground/10 bg-foreground/5 text-foreground/40 hover:text-foreground'
          }`}
          aria-label="フィルターを開く"
        >
          <SlidersHorizontal size={14} />
          {activeFilterCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-white">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* フィルターパネル */}
      {showFilters && (
        <div ref={filterPanelRef} className="absolute left-0 top-full z-50 mt-1 w-[520px] rounded-md border border-foreground/10 bg-background p-3 shadow-lg">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-medium text-foreground/60">フィルター</span>
            {hasActiveFilters(filters) && (
              <button
                onClick={handleClearFilters}
                className="text-[11px] text-primary hover:underline"
              >
                すべてクリア
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            {/* ステータス（複数選択可） */}
            <MultiSelectDropdown<TaskStatus>
              label="ステータス"
              options={ALL_STATUSES}
              selected={filters.status}
              onChange={(val) => handleFilterChange({ ...filters, status: val })}
              renderOption={(s) => (
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${statusConfig[s].className}`}>
                  {statusConfig[s].label}
                </span>
              )}
            />

            {/* 優先度（複数選択可） */}
            <MultiSelectDropdown<Priority>
              label="優先度"
              options={ALL_PRIORITIES}
              selected={filters.priority}
              onChange={(val) => handleFilterChange({ ...filters, priority: val })}
              renderOption={(p) => (
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${priorityConfig[p].className}`}>
                  {priorityConfig[p].label}
                </span>
              )}
            />

            {/* 担当者 */}
            <div className="relative">
              <select
                value={filters.assigneeId ?? ''}
                onChange={(e) =>
                  handleFilterChange({
                    ...filters,
                    assigneeId: e.target.value || null,
                  })
                }
                className="h-8 w-full appearance-none rounded-md border border-foreground/10 bg-foreground/5 px-2.5 pr-7 text-xs text-foreground hover:border-foreground/20 focus:border-primary focus:outline-none"
              >
                <option value="">担当者</option>
                {assignees.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={12}
                className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-foreground/40"
              />
            </div>

            {/* カテゴリ（複数選択可） */}
            <MultiSelectDropdown<string>
              label="カテゴリ"
              options={categories.map((c) => c.id)}
              selected={filters.categoryId}
              onChange={(val) => handleFilterChange({ ...filters, categoryId: val })}
              renderOption={(id) => {
                const cat = categories.find((c) => c.id === id)
                if (!cat) return id
                return (
                  <span
                    className="rounded-full px-1.5 py-0.5 text-[10px] font-medium"
                    style={{
                      backgroundColor: `color-mix(in oklch, ${cat.color} 15%, transparent)`,
                      color: cat.color,
                    }}
                  >
                    {cat.name}
                  </span>
                )
              }}
            />

            {/* 期限範囲（開始日〜終了日） */}
            <div className="col-span-2 flex items-center gap-2">
              <Calendar size={12} className="shrink-0 text-foreground/40" />
              <span className="text-xs text-foreground/50">期限:</span>
              <input
                type="date"
                value={filters.dueDateFrom}
                onChange={(e) =>
                  handleFilterChange({ ...filters, dueDateFrom: e.target.value })
                }
                className="h-7 rounded-md border border-foreground/10 bg-foreground/5 px-2 text-xs text-foreground focus:border-primary focus:outline-none"
              />
              <span className="text-xs text-foreground/40">&ndash;</span>
              <input
                type="date"
                value={filters.dueDateTo}
                onChange={(e) =>
                  handleFilterChange({ ...filters, dueDateTo: e.target.value })
                }
                className="h-7 rounded-md border border-foreground/10 bg-foreground/5 px-2 text-xs text-foreground focus:border-primary focus:outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* 検索結果ドロップダウン */}
      {showDropdown && (
        <div
          className="absolute left-0 z-50 w-[480px] max-h-[400px] overflow-y-auto rounded-md border border-foreground/10 bg-background shadow-lg"
          style={{ top: showFilters && filterPanelHeight > 0 ? `calc(100% + ${filterPanelHeight + 8}px)` : 'calc(100% + 4px)' }}
        >
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
