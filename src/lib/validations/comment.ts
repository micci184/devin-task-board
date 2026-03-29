import { z } from 'zod'

export const createCommentSchema = z.object({
  content: z.string().min(1, 'コメント内容は必須です').max(10000, 'コメントは10000文字以内で入力してください'),
})

export type CreateCommentInput = z.infer<typeof createCommentSchema>

export const updateCommentSchema = z.object({
  content: z.string().min(1, 'コメント内容は必須です').max(10000, 'コメントは10000文字以内で入力してください'),
})

export type UpdateCommentInput = z.infer<typeof updateCommentSchema>
