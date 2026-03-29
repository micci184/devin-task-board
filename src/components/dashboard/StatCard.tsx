import type { LucideIcon } from 'lucide-react'

type StatCardProps = {
  title: string
  value: number
  icon: LucideIcon
  color: string
}

export const StatCard = ({ title, value, icon: Icon, color }: StatCardProps) => (
  <div className="flex items-center gap-4 rounded-lg border border-foreground/10 bg-background p-5">
    <div
      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg"
      style={{ backgroundColor: color }}
    >
      <Icon size={24} className="text-white" />
    </div>
    <div>
      <p className="text-sm text-foreground/60">{title}</p>
      <p className="text-2xl font-bold text-foreground">{value.toLocaleString()}</p>
    </div>
  </div>
)
