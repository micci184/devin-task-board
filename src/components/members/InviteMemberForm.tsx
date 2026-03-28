'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

import { UserPlus } from 'lucide-react'
import { toast } from 'sonner'

import { inviteMemberSchema } from '@/lib/validations/member'

import type { InviteMemberInput } from '@/lib/validations/member'

interface InviteMemberFormProps {
  projectId: string
}

export const InviteMemberForm = ({ projectId }: InviteMemberFormProps) => {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof InviteMemberInput, string>>>({})

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setFieldErrors({})

    const form = e.currentTarget
    const formData = new FormData(form)
    const data = {
      email: formData.get('email') as string,
      role: formData.get('role') as string,
    }

    const parsed = inviteMemberSchema.safeParse(data)
    if (!parsed.success) {
      const errors: Partial<Record<keyof InviteMemberInput, string>> = {}
      for (const issue of parsed.error.issues) {
        const field = issue.path[0] as keyof InviteMemberInput
        if (!errors[field]) errors[field] = issue.message
      }
      setFieldErrors(errors)
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
      })

      const json = await res.json()

      if (!res.ok) {
        toast.error(json.error?.message ?? 'メンバーの招待に失敗しました')
        return
      }

      toast.success('メンバーを招待しました')
      form.reset()
      router.refresh()
    } catch {
      toast.error('ネットワークエラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 sm:flex-row sm:items-end">
      <div className="flex-1">
        <label htmlFor="invite-email" className="mb-1 block text-sm font-medium text-foreground">
          メールアドレス <span className="text-danger">*</span>
        </label>
        <input
          id="invite-email"
          name="email"
          type="email"
          className="w-full rounded-md border border-foreground/20 bg-background px-3 py-2 text-sm text-foreground placeholder:text-foreground/40 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          placeholder="user@example.com"
        />
        {fieldErrors.email && (
          <p className="mt-1 text-sm text-danger">{fieldErrors.email}</p>
        )}
      </div>

      <div className="w-full sm:w-40">
        <label htmlFor="invite-role" className="mb-1 block text-sm font-medium text-foreground">
          権限 <span className="text-danger">*</span>
        </label>
        <select
          id="invite-role"
          name="role"
          defaultValue="MEMBER"
          className="w-full rounded-md border border-foreground/20 bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="ADMIN">管理者</option>
          <option value="MEMBER">メンバー</option>
          <option value="VIEWER">閲覧者</option>
        </select>
        {fieldErrors.role && (
          <p className="mt-1 text-sm text-danger">{fieldErrors.role}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
      >
        <UserPlus size={16} />
        {loading ? '招待中...' : '招待'}
      </button>
    </form>
  )
}
