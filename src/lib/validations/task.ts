import { z } from 'zod'

export const createTaskSchema = z.object({
  title: z.string().min(1, 'タイトルは必須です').max(255, 'タイトルは255文字以内で入力してください'),
  description: z.string().max(1000, '説明は1000文字以内で入力してください').optional(),
  priority: z.enum(['URGENT', 'HIGH', 'MEDIUM', 'LOW', 'NONE']).default('NONE'),
  assigneeId: z.string().optional(),
  dueDate: z.string().optional(),
  status: z.enum(['BACKLOG', 'TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE']).default('BACKLOG'),
  categoryIds: z.array(z.string()).optional(),
})

export type CreateTaskInput = z.infer<typeof createTaskSchema>

export const updateTaskStatusSchema = z.object({
  status: z.enum(['BACKLOG', 'TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE']),
  sortOrder: z.number().int().optional(),
})

export type UpdateTaskStatusInput = z.infer<typeof updateTaskStatusSchema>

export const updateTaskSchema = z.object({
  title: z.string().min(1, 'タイトルは必須です').max(255, 'タイトルは255文字以内で入力してください').optional(),
  description: z.string().max(1000, '説明は1000文字以内で入力してください').nullable().optional(),
  status: z.enum(['BACKLOG', 'TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE']).optional(),
  priority: z.enum(['URGENT', 'HIGH', 'MEDIUM', 'LOW', 'NONE']).optional(),
  assigneeId: z.string().nullable().optional(),
  dueDate: z.string().nullable().optional(),
  estimatedHours: z.number().min(0, '見積もり工数は0以上で入力してください').nullable().optional(),
  actualHours: z.number().min(0, '実績工数は0以上で入力してください').nullable().optional(),
  categoryIds: z.array(z.string()).optional(),
})

export type UpdateTaskInput = z.infer<typeof updateTaskSchema>

export const createSubtaskSchema = z.object({
  title: z.string().min(1, 'タイトルは必須です').max(255, 'タイトルは255文字以内で入力してください'),
  description: z.string().max(1000, '説明は1000文字以内で入力してください').optional(),
  priority: z.enum(['URGENT', 'HIGH', 'MEDIUM', 'LOW', 'NONE']).default('NONE'),
  assigneeId: z.string().optional(),
  dueDate: z.string().optional(),
  status: z.enum(['BACKLOG', 'TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE']).default('TODO'),
})

export type CreateSubtaskInput = z.infer<typeof createSubtaskSchema>
