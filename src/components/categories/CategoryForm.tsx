'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

import { Plus } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'

import { createCategorySchema } from '@/lib/validations/category'

import type { CreateCategoryInput } from '@/lib/validations/category'

const COLOR_PRESETS = [
  { key: 'red', value: 'oklch(0.55 0.22 27)' },
  { key: 'blue', value: 'oklch(0.55 0.12 250)' },
  { key: 'green', value: 'oklch(0.55 0.15 160)' },
  { key: 'purple', value: 'oklch(0.55 0.15 300)' },
  { key: 'orange', value: 'oklch(0.65 0.18 55)' },
  { key: 'pink', value: 'oklch(0.6 0.18 350)' },
  { key: 'cyan', value: 'oklch(0.65 0.12 200)' },
  { key: 'yellow', value: 'oklch(0.75 0.15 85)' },
]

interface CategoryFormProps {
  projectId: string
}

export const CategoryForm = ({ projectId }: CategoryFormProps) => {
  const router = useRouter()
  const t = useTranslations('categories')
  const tCommon = useTranslations('common')
  const [loading, setLoading] = useState(false)
  const [selectedColor, setSelectedColor] = useState(COLOR_PRESETS[0].value)
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof CreateCategoryInput, string>>>({})

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setFieldErrors({})

    const form = e.currentTarget
    const formData = new FormData(form)
    const data = {
      name: formData.get('name') as string,
      color: selectedColor,
    }

    const parsed = createCategorySchema.safeParse(data)
    if (!parsed.success) {
      const errors: Partial<Record<keyof CreateCategoryInput, string>> = {}
      for (const issue of parsed.error.issues) {
        const field = issue.path[0] as keyof CreateCategoryInput
        if (!errors[field]) errors[field] = issue.message
      }
      setFieldErrors(errors)
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
      })

      const json = await res.json()

      if (!res.ok) {
        toast.error(json.error?.message ?? t('createError'))
        return
      }

      toast.success(t('createSuccess'))
      form.reset()
      setSelectedColor(COLOR_PRESETS[0].value)
      router.refresh()
    } catch {
      toast.error(tCommon('networkError'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label htmlFor="category-name" className="mb-1 block text-sm font-medium text-foreground">
            {t('nameLabel')} <span className="text-danger">*</span>
          </label>
          <input
            id="category-name"
            name="name"
            type="text"
            className="w-full rounded-md border border-foreground/20 bg-background px-3 py-2 text-sm text-foreground placeholder:text-foreground/40 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder={t('namePlaceholder')}
          />
          {fieldErrors.name && (
            <p className="mt-1 text-sm text-danger">{fieldErrors.name}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          <Plus size={16} />
          {loading ? tCommon('creating') : tCommon('add')}
        </button>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-foreground">{t('colorLabel')}</label>
        <div className="flex flex-wrap gap-2">
          {COLOR_PRESETS.map((preset) => (
            <button
              key={preset.value}
              type="button"
              onClick={() => setSelectedColor(preset.value)}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                selectedColor === preset.value
                  ? 'ring-2 ring-primary ring-offset-2 ring-offset-background'
                  : 'hover:opacity-80'
              }`}
              style={{ backgroundColor: preset.value, color: 'white' }}
              title={t(`colors.${preset.key}`)}
            >
              {t(`colors.${preset.key}`)}
            </button>
          ))}
        </div>
        {fieldErrors.color && (
          <p className="mt-1 text-sm text-danger">{fieldErrors.color}</p>
        )}
      </div>
    </form>
  )
}
