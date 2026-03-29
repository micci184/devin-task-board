import { Skeleton } from '@/components/ui/skeleton'

const DashboardLoading = () => (
  <div className="space-y-6">
    <div>
      <Skeleton className="h-8 w-48" />
      <Skeleton className="mt-2 h-5 w-64" />
    </div>

    {/* サマリーカード */}
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-24 rounded-lg" />
      ))}
    </div>

    {/* グラフ */}
    <div className="grid gap-6 lg:grid-cols-2">
      <Skeleton className="h-80 rounded-lg" />
      <Skeleton className="h-80 rounded-lg" />
    </div>
    <Skeleton className="h-80 rounded-lg" />

    {/* タスク一覧・アクティビティ */}
    <div className="grid gap-6 lg:grid-cols-2">
      <Skeleton className="h-64 rounded-lg" />
      <Skeleton className="h-64 rounded-lg" />
    </div>
    <Skeleton className="h-80 rounded-lg" />
  </div>
)
export default DashboardLoading
