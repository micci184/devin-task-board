import { formatDistanceToNow } from 'date-fns'
import { ja } from 'date-fns/locale'

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

const ACTION_LABELS: Record<string, string> = {
  CREATED: '作成',
  UPDATED: '更新',
  DELETED: '削除',
  STATUS_CHANGED: 'ステータス変更',
  ASSIGNED: 'アサイン',
  COMMENTED: 'コメント',
  ATTACHED: 'ファイル添付',
}

const ENTITY_LABELS: Record<string, string> = {
  task: 'タスク',
  comment: 'コメント',
  project: 'プロジェクト',
}

type Props = {
  activities: ActivityItem[]
}

export const ActivityFeed = ({ activities }: Props) => (
  <div className="rounded-lg border border-foreground/10 bg-background p-5">
    <h3 className="mb-4 text-sm font-semibold text-foreground">最近のアクティビティ</h3>
    {activities.length === 0 ? (
      <p className="text-sm text-foreground/40">アクティビティがありません</p>
    ) : (
      <ul className="space-y-3">
        {activities.map((activity) => (
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
                {' が '}
                {ENTITY_LABELS[activity.entityType] ?? activity.entityType}
                {' を '}
                {ACTION_LABELS[activity.action] ?? activity.action}
                {' しました'}
              </p>
              <p className="mt-0.5 text-xs text-foreground/40">
                {formatDistanceToNow(new Date(activity.createdAt), {
                  addSuffix: true,
                  locale: ja,
                })}
              </p>
            </div>
          </li>
        ))}
      </ul>
    )}
  </div>
)
