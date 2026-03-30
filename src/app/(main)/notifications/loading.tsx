import { Skeleton } from '@/components/ui/skeleton'

const Loading = () => {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Skeleton className="h-7 w-16" />
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Skeleton className="h-8 w-16 rounded-md" />
          <Skeleton className="h-8 w-16 rounded-md" />
          <Skeleton className="h-8 w-16 rounded-md" />
        </div>
        <Skeleton className="h-8 w-36 rounded-md" />
      </div>
      <div className="divide-y divide-foreground/10 rounded-lg border border-foreground/10">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-start gap-3 px-4 py-3">
            <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-64" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
export default Loading
