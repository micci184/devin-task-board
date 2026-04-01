import { Skeleton } from '@/components/ui/skeleton'

const SettingsLoading = () => (
  <div className="mx-auto max-w-2xl">
    <div className="mb-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="mt-2 h-5 w-64" />
    </div>

    {/* ProjectNav */}
    <div className="mb-6 flex gap-1 border-b border-foreground/10 pb-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-8 w-20 rounded-md" />
      ))}
    </div>

    <div className="space-y-8">
      {/* 基本情報フォーム */}
      <div className="rounded-lg border border-foreground/10 p-6">
        <Skeleton className="mb-4 h-6 w-24" />
        <div className="space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-24 w-full rounded-md" />
          </div>
        </div>
        <div className="mt-6 flex justify-end">
          <Skeleton className="h-10 w-20 rounded-md" />
        </div>
      </div>

      {/* メンバーセクション */}
      <div>
        <Skeleton className="mb-4 h-6 w-36" />
        <div className="mb-6 rounded-lg border border-foreground/10 p-4">
          <Skeleton className="mb-3 h-4 w-32" />
          <div className="flex gap-2">
            <Skeleton className="h-10 flex-1 rounded-md" />
            <Skeleton className="h-10 w-24 rounded-md" />
            <Skeleton className="h-10 w-20 rounded-md" />
          </div>
        </div>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      </div>

      {/* カテゴリセクション */}
      <div>
        <Skeleton className="mb-4 h-6 w-32" />
        <div className="mb-6 rounded-lg border border-foreground/10 p-4">
          <Skeleton className="mb-3 h-4 w-32" />
          <div className="flex gap-2">
            <Skeleton className="h-10 flex-1 rounded-md" />
            <Skeleton className="h-10 w-20 rounded-md" />
          </div>
        </div>
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  </div>
)
export default SettingsLoading
