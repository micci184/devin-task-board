import { z } from 'zod'

export const searchQuerySchema = z.object({
  q: z.string().min(1, '検索クエリは必須です'),
  status: z.enum(['BACKLOG', 'TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE']).optional(),
  priority: z.enum(['URGENT', 'HIGH', 'MEDIUM', 'LOW', 'NONE']).optional(),
  assigneeId: z.string().optional(),
  categoryId: z.string().optional(),
  dueDateFrom: z.string().optional(),
  dueDateTo: z.string().optional(),
})
