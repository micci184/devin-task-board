import { z } from 'zod'

export const createCategorySchema = z.object({
  name: z.string().trim().min(1, 'カテゴリ名は必須です').max(100, 'カテゴリ名は100文字以内で入力してください'),
  color: z.string().min(1, 'カラーは必須です'),
})

export const updateCategorySchema = z.object({
  name: z.string().trim().min(1, 'カテゴリ名は必須です').max(100, 'カテゴリ名は100文字以内で入力してください').optional(),
  color: z.string().min(1, 'カラーは必須です').optional(),
})

export type CreateCategoryInput = z.infer<typeof createCategorySchema>
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>
