import { Skeleton } from '@/components/ui/skeleton'

const ProjectsLoading = () => (
  <div>
    <div className="mb-6 flex items-center justify-between">
      <div>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-2 h-5 w-64" />
      </div>
      <Skeleton className="h-10 w-40 rounded-md" />
    </div>

    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-lg border border-foreground/10 p-5">
          <div className="mb-3 flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-md" />
            <div>
              <Skeleton className="h-4 w-32" />
              <Skeleton className="mt-1.5 h-3 w-48" />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      ))}
    </div>
  </div>
)
export default ProjectsLoading
