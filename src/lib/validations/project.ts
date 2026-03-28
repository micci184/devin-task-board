import { z } from 'zod'

export const createProjectSchema = z.object({
  name: z.string().min(1, 'プロジェクト名は必須です').max(255, 'プロジェクト名は255文字以内で入力してください'),
  description: z.string().max(1000, '説明は1000文字以内で入力してください').optional(),
})

export const updateProjectSchema = z.object({
  name: z.string().min(1, 'プロジェクト名は必須です').max(255, 'プロジェクト名は255文字以内で入力してください').optional(),
  description: z.string().max(1000, '説明は1000文字以内で入力してください').optional(),
})

export type CreateProjectInput = z.infer<typeof createProjectSchema>
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>
