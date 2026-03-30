'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

import { Pencil, Trash2, Check, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'

import { updateCategorySchema } from '@/lib/validations/category'

const COLOR_PRESETS = [
  { key: 'red', value: 'oklch(0.55 0.22 27)' },
  { key: 'blue', value: 'oklch(0.55 0.12 250)' },
  { key: 'green', value: 'oklch(0.55 0.15 160)' },
  { key: 'purple', value: 'oklch(0.55 0.15 300)' },
  { key: 'orange', value: 'oklch(0.65 0.18 55)' },
  { key: 'pink', value: 'oklch(0.6 0.18 350)' },
  { key: 'cyan', value: 'oklch(0.65 0.12 200)' },
  { key: 'yellow', value: 'oklch(0.75 0.15 85)' },
] as const

interface Category {
  id: string
  name: string
  color: string
  projectId: string
  createdAt: string
  updatedAt: string
}

interface CategoryListProps {
  categories: Category[]
  canManage: boolean
}

export const CategoryList = ({ categories, canManage }: CategoryListProps) => {
  const router = useRouter()
  const t = useTranslations('categories')
  const tCommon = useTranslations('common')
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editColor, setEditColor] = useState('')
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const startEdit = (category: Category) => {
    setEditingId(category.id)
    setEditName(category.name)
    setEditColor(category.color)
    setConfirmDeleteId(null)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditName('')
    setEditColor('')
  }

  const handleUpdate = async (categoryId: string) => {
    const parsed = updateCategorySchema.safeParse({ name: editName, color: editColor })
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message)
      return
    }

    setLoadingId(categoryId)
    try {
      const res = await fetch(`/api/categories/${categoryId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
      })

      const json = await res.json()

      if (!res.ok) {
        toast.error(json.error?.message ?? t('updateError'))
        return
      }

      toast.success(t('updateSuccess'))
      cancelEdit()
      router.refresh()
    } catch {
      toast.error(tCommon('networkError'))
    } finally {
      setLoadingId(null)
    }
  }

  const handleDelete = async (categoryId: string) => {
    setLoadingId(categoryId)
    try {
      const res = await fetch(`/api/categories/${categoryId}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const json = await res.json()
        toast.error(json.error?.message ?? t('deleteError'))
        return
      }

      toast.success(t('deleteSuccess'))
      setConfirmDeleteId(null)
      router.refresh()
    } catch {
      toast.error(tCommon('networkError'))
    } finally {
      setLoadingId(null)
    }
  }

  if (categories.length === 0) {
    return (
      <div className="rounded-lg border border-foreground/10 p-6 text-center text-sm text-foreground/50">
        {t('empty')}
      </div>
    )
  }

  return (
    <div className="divide-y divide-foreground/10 rounded-lg border border-foreground/10">
      {categories.map((category) => {
        const isEditing = editingId === category.id
        const isLoading = loadingId === category.id
        const isConfirmingDelete = confirmDeleteId === category.id

        return (
          <div
            key={category.id}
            className="flex items-center justify-between px-4 py-3"
          >
            {isEditing ? (
              <div className="flex flex-1 flex-col gap-3">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="flex-1 rounded-md border border-foreground/20 bg-background px-3 py-1.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <button
                    onClick={() => handleUpdate(category.id)}
                    disabled={isLoading}
                    className="rounded-md p-1.5 text-success hover:bg-success/10 disabled:opacity-50"
                    title={tCommon('save')}
                  >
                    <Check size={16} />
                  </button>
                  <button
                    onClick={cancelEdit}
                    disabled={isLoading}
                    className="rounded-md p-1.5 text-foreground/40 hover:bg-foreground/5 disabled:opacity-50"
                    title={tCommon('cancel')}
                  >
                    <X size={16} />
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {COLOR_PRESETS.map((preset) => (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => setEditColor(preset.value)}
                      className={`h-6 w-6 rounded-full transition-all ${
                        editColor === preset.value
                          ? 'ring-2 ring-primary ring-offset-2 ring-offset-background'
                          : 'hover:opacity-80'
                      }`}
                      style={{ backgroundColor: preset.value }}
                      title={t(`colors.${preset.key}`)}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <span
                  className="inline-block h-4 w-4 rounded-full"
                  style={{ backgroundColor: category.color }}
                />
                <span className="text-sm font-medium text-foreground">{category.name}</span>
              </div>
            )}

            {canManage && !isEditing && (
              <div className="flex items-center gap-1">
                {isConfirmingDelete ? (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleDelete(category.id)}
                      disabled={isLoading}
                      className="rounded-md bg-danger px-2 py-1 text-xs font-medium text-white hover:opacity-90 disabled:opacity-50"
                    >
                      {isLoading ? tCommon('deleting') : tCommon('confirm')}
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(null)}
                      disabled={isLoading}
                      className="rounded-md border border-foreground/20 px-2 py-1 text-xs font-medium text-foreground hover:bg-foreground/5 disabled:opacity-50"
                    >
                      {tCommon('cancel')}
                    </button>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => startEdit(category)}
                      disabled={isLoading}
                      className="rounded-md p-1.5 text-foreground/40 hover:bg-primary/10 hover:text-primary disabled:opacity-50"
                      title={t('editCategory')}
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(category.id)}
                      disabled={isLoading}
                      className="rounded-md p-1.5 text-foreground/40 hover:bg-danger/10 hover:text-danger disabled:opacity-50"
                      title={t('deleteCategory')}
                    >
                      <Trash2 size={14} />
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
