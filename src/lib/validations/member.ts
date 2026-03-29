import { z } from 'zod'

export const inviteMemberSchema = z.object({
  email: z.string().email('有効なメールアドレスを入力してください'),
  role: z.enum(['ADMIN', 'MEMBER', 'VIEWER'], {
    message: '権限を選択してください',
  }),
})

export type InviteMemberInput = z.infer<typeof inviteMemberSchema>

export const updateMemberRoleSchema = z.object({
  role: z.enum(['ADMIN', 'MEMBER', 'VIEWER'], {
    message: '有効な権限を選択してください',
  }),
})

export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>
