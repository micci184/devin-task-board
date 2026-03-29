import type { HTMLAttributes } from 'react'

const Skeleton = ({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div
    className={`animate-pulse rounded-md bg-foreground/10 ${className}`}
    {...props}
  />
)

export { Skeleton }
