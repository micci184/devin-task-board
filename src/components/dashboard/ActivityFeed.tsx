import { formatDistanceToNow } from 'date-fns'
import { ja } from 'date-fns/locale'
import { getTranslations } from 'next-intl/server'
import { getLocale } from 'next-intl/server'

type ActivityItem = {
  id: string
  action: string
  entityType: string
  entityId: string
  userId: string
  projectId: string
  oldValue: unknown
  newValue: unknown
  createdAt: string
  user: {
    id: string
    name: string
    avatarUrl: string | null
  }
}


type Props = {
  activities: ActivityItem[]
}

export const ActivityFeed = async ({ activities }: Props) => {
  const t = await getTranslations('activity')
  const tDashboard = await getTranslations('dashboard')
  const locale = await getLocale()

  return (
    <div className="rounded-lg border border-foreground/10 bg-background p-5">
      <h3 className="mb-4 text-sm font-semibold text-foreground">{tDashboard('recentActivity')}</h3>
      {activities.length === 0 ? (
        <p className="text-sm text-foreground/40">{tDashboard('noActivity')}</p>
      ) : (
        <ul className="space-y-3">
          {activities.map((activity) => {
            const actionLabel = t(`actions.${activity.action}` as 'actions.CREATED' | 'actions.UPDATED' | 'actions.DELETED' | 'actions.STATUS_CHANGED' | 'actions.ASSIGNED' | 'actions.COMMENTED' | 'actions.ATTACHED')
            const entityLabel = t(`entities.${activity.entityType}` as 'entities.task' | 'entities.comment' | 'entities.project')
            return (
              <li
                key={activity.id}
                className="flex items-start gap-3 border-b border-foreground/5 pb-3 last:border-b-0 last:pb-0"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                  {activity.user.name.slice(0, 1)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-foreground">
                    <span className="font-medium">{activity.user.name}</span>
                    {' '}
                    {t('feedMessage', { entity: entityLabel, action: actionLabel })}
                  </p>
                  <p className="mt-0.5 text-xs text-foreground/40">
                    {formatDistanceToNow(new Date(activity.createdAt), {
                      addSuffix: true,
                      locale: locale === 'ja' ? ja : undefined,
                    })}
                  </p>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
