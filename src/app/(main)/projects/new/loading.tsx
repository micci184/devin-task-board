import { Skeleton } from '@/components/ui/skeleton'

const NewProjectLoading = () => (
  <div className="mx-auto max-w-2xl">
    <div className="mb-6">
      <Skeleton className="h-8 w-56" />
      <Skeleton className="mt-2 h-5 w-72" />
    </div>

    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-10 w-full rounded-md" />
        <Skeleton className="h-3 w-48" />
      </div>

      <div className="space-y-2">
        <Skeleton className="h-4 w-12" />
        <Skeleton className="h-24 w-full rounded-md" />
      </div>

      <div className="flex items-center justify-between border-t border-foreground/10 pt-6">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-10 w-40 rounded-md" />
      </div>
    </div>
  </div>
)
export default NewProjectLoading
