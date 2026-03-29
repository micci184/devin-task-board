import { redirect } from 'next/navigation'

import { auth } from '@/lib/auth'
import { ProjectCreateForm } from '@/components/projects/ProjectCreateForm'

const NewProjectPage = async () => {
  const session = await auth()
  if (!session?.user) {
    redirect('/login')
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">
          新規プロジェクト作成
        </h1>
        <p className="text-sm text-foreground/60">
          プロジェクト名と説明を入力してください
        </p>
      </div>

      <ProjectCreateForm />
    </div>
  )
}
export default NewProjectPage
