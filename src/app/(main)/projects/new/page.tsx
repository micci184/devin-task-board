import { redirect } from 'next/navigation'

import { getTranslations } from 'next-intl/server'

import { auth } from '@/lib/auth'
import { ProjectCreateForm } from '@/components/projects/ProjectCreateForm'

const NewProjectPage = async () => {
  const session = await auth()
  if (!session?.user) {
    redirect('/login')
  }

  const t = await getTranslations('projects')

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">
          {t('createTitle')}
        </h1>
        <p className="text-sm text-foreground/60">
          {t('createDescription')}
        </p>
      </div>

      <ProjectCreateForm />
    </div>
  )
}
export default NewProjectPage
