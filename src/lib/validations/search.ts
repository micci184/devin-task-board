import { z } from 'zod'

const STATUSES = ['BACKLOG', 'TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'] as const
const PRIORITIES = ['URGENT', 'HIGH', 'MEDIUM', 'LOW', 'NONE'] as const

/**
 * カンマ区切り文字列を配列に変換し、各要素をバリデーションする。
 */
const csvStatuses = z
  .string()
  .transform((val) => val.split(',').map((s) => s.trim()).filter(Boolean))
  .pipe(z.array(z.enum(STATUSES)).min(1))

const csvPriorities = z
  .string()
  .transform((val) => val.split(',').map((s) => s.trim()).filter(Boolean))
  .pipe(z.array(z.enum(PRIORITIES)).min(1))

const csvStrings = z
  .string()
  .transform((val) => val.split(',').map((s) => s.trim()).filter(Boolean))
  .pipe(z.array(z.string().min(1)).min(1))

export const searchQuerySchema = z.object({
  q: z.string().min(1, '検索クエリは必須です'),
  status: csvStatuses.optional(),
  priority: csvPriorities.optional(),
  assigneeId: z.string().optional(),
  categoryId: csvStrings.optional(),
  dueDateFrom: z.string().optional(),
  dueDateTo: z.string().optional(),
})
